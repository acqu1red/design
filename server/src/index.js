
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import AdmZip from 'adm-zip';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const COMET_KEY = process.env.COMET_API_KEY;

app.use(cors());
app.use(express.json({limit:'20mb'}));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ensure textures exist: unzip once
const ASSETS_DIR = path.join(process.cwd(), 'assets');
const TEX_ROOT = path.join(ASSETS_DIR, 'textures');
const TEX_ZIP = path.join(ASSETS_DIR, 'textures_pack.zip');
if (!fs.existsSync(TEX_ROOT) && fs.existsSync(TEX_ZIP)) {
  const zip = new AdmZip(TEX_ZIP);
  zip.extractAllTo(ASSETS_DIR, true);
  console.log('[assets] extracted textures_pack.zip');
}

// Load catalog.json if present
let CATALOG = null;
function findCatalog(root){
  if (!fs.existsSync(root)) return null;
  const stack = [root, ASSETS_DIR];
  while (stack.length){
    const dir = stack.pop();
    for (const f of fs.readdirSync(dir)){
      const p = path.join(dir, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) stack.push(p);
      else if (f.toLowerCase() === 'catalog.json') return p;
    }
  }
  return null;
}
try {
  const cat = findCatalog(TEX_ROOT);
  if (cat) {
    CATALOG = JSON.parse(fs.readFileSync(cat,'utf-8'));
    console.log('[catalog] loaded', cat);
  }
} catch(e){ console.warn('[catalog] not loaded:', e.message); }

// Multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `plan_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res)=>{
  res.json({ url: `${BASE_URL}/uploads/${req.file.filename}` });
});

function urlFromLocalPath(local){
  const rel = local.replace(/\\\\/g,'/').split('/').slice(-5).join('/');
  return `${BASE_URL}/${rel}`.replace('/textures/','/assets/textures/');
}

function makeOverlayPrompt(tex, catalog){
  const get = (id)=>{
    const m = catalog?.materials?.find(x=>x.id===id);
    return m ? `${m.id} (repeat ${m.scale_m_per_repeat} m)` : 'as uploaded';
  };
  return [
    "Top-down interior plan MATERIAL OVERLAY ONLY. Keep geometry 100% identical: walls, doors, windows unchanged; do not move or redraw.",
    `Walls: ${get(tex.wall)}; Floor: ${get(tex.floor)}; Doors: ${get(tex.doors) || 'keep original'}; Fabrics: ${get(tex.fabric) || 'keep original'}.`,
    "No new objects. No text or logos. Keep same resolution."
  ].join(' ');
}

function makeRoomPrompt(room, textures, catalog){
  const want = (id)=>{
    const m = catalog?.materials?.find(x=>x.id===id);
    return m ? `${m.id} at scale ${m.scale_m_per_repeat} m` : 'neutral';
  };
  return [
    `Photorealistic interior perspective of a ${room.type || 'room'} based on plan (do not change layout).`,
    `Finishes: walls -> ${want(room.wallTex || textures.wall)}, floor -> ${want(room.floorTex || textures.floor)}.`,
    "Respect implied door/window positions. No extra walls, no text."
  ].join(' ');
}

app.post('/api/plan/decorate', async (req,res)=>{
  try{
    const { planUrl, textures={}, aspect_ratio='1:1' } = req.body;
    if (!COMET_KEY) return res.status(400).json({error:'Missing COMET_API_KEY'});
    if (!planUrl) return res.status(400).json({error:'planUrl required'});

    const refs = [];
    const ids = [textures.wall, textures.floor, textures.doors, textures.fabric].filter(Boolean);
    for (const id of ids){
      const item = CATALOG?.materials?.find(m=>m.id===id);
      if (item) refs.push(urlFromLocalPath(item.albedo_url));
    }
    const input = {
      prompt: makeOverlayPrompt(textures, CATALOG),
      input_image: planUrl,
      output_format: 'png',
      aspect_ratio
    };
    if (refs[0]) input['input_image_2'] = refs[0];
    if (refs[1]) input['input_image_3'] = refs[1];
    if (refs[2]) input['input_image_4'] = refs[2];

    const resp = await axios.post(
      'https://api.cometapi.com/replicate/v1/models/black-forest-labs/flux-kontext-max/predictions',
      { input },
      { headers: { Authorization: `Bearer ${COMET_KEY}`, 'Content-Type':'application/json' } }
    );
    res.json(resp.data);
  }catch(e){
    res.status(500).json({error: e.response?.data || e.message});
  }
});

app.post('/api/visualize', async (req,res)=>{
  try{
    const { planUrl, rooms=[], textures={}, aspect_ratio='16:9' } = req.body;
    if (!COMET_KEY) return res.status(400).json({error:'Missing COMET_API_KEY'});
    const out = [];
    for (const room of rooms){
      const refs = [];
      const ids = [room.wallTex || textures.wall, room.floorTex || textures.floor, textures.fabric].filter(Boolean);
      for (const id of ids){
        const item = CATALOG?.materials?.find(m=>m.id===id);
        if (item) refs.push(urlFromLocalPath(item.albedo_url));
      }
      const input = {
        prompt: makeRoomPrompt(room, textures, CATALOG),
        input_image: planUrl,
        output_format: 'png',
        aspect_ratio
      };
      if (refs[0]) input['input_image_2'] = refs[0];
      if (refs[1]) input['input_image_3'] = refs[1];
      if (refs[2]) input['input_image_4'] = refs[2];

      const resp = await axios.post(
        'https://api.cometapi.com/replicate/v1/models/black-forest-labs/flux-kontext-max/predictions',
        { input },
        { headers: { Authorization: `Bearer ${COMET_KEY}`, 'Content-Type':'application/json' } }
      );
      out.push({ room: room.name, id: resp.data.id, get: resp.data.urls?.get });
    }
    res.json({ tasks: out });
  }catch(e){
    res.status(500).json({error: e.response?.data || e.message});
  }
});

app.get('/api/tasks/:id', async (req,res)=>{
  try{
    const r = await axios.get(`https://api.cometapi.com/replicate/v1/predictions/${req.params.id}`, {
      headers: { Authorization: `Bearer ${COMET_KEY}` }
    });
    res.json(r.data);
  }catch(e){
    res.status(500).json({error: e.response?.data || e.message});
  }
});

// serve assets for references
app.use('/assets', express.static(ASSETS_DIR));

app.listen(PORT, ()=>{
  console.log('API on :'+PORT);
  console.log('Assets:', `${BASE_URL}/assets`);
});
