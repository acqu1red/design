
import React, { useState, useEffect } from 'react'
import { upload, decorate, visualize, queryTask } from './api.js'

const DEFAULT_ROOMS = [
  { name:'Left Bedroom', type:'bedroom' },
  { name:'Living Room', type:'living room' },
  { name:'Right Bedroom', type:'bedroom' },
  { name:'Kitchen', type:'kitchen' },
  { name:'Bathroom', type:'bathroom' }
];

export default function App(){
  const [file, setFile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [textures, setTextures] = useState({ wall:'wall_marble_dark_green', floor:'floor_planks_linear_olive', doors:'door_paint_dark_graphite', fabric:'fabric_velvet_deep_green' });
  const [overlayTask, setOverlayTask] = useState(null);
  const [overlayImage, setOverlayImage] = useState(null);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [roomTasks, setRoomTasks] = useState([]);
  const [gallery, setGallery] = useState([]);

  const doUpload = async () => {
    if (!file) return;
    const r = await upload(file);
    setPlan(r.url);
  };

  async function pollTaskOnce(id){
    const r = await queryTask(id);
    return r;
  }

  useEffect(()=>{
    if (!overlayTask?.id) return;
    const h = setInterval(async ()=>{
      const r = await pollTaskOnce(overlayTask.id);
      if (r?.status === 'succeeded' && r?.output?.[0]){
        setOverlayImage(r.output[0]);
        clearInterval(h);
      }
    }, 2500);
    return ()=> clearInterval(h);
  }, [overlayTask]);

  useEffect(()=>{
    if (!roomTasks?.length) return;
    const h = setInterval(async ()=>{
      const done = [];
      const pending = [];
      for (const t of roomTasks){
        if (t.done) { done.push(t); continue; }
        const r = await pollTaskOnce(t.id);
        if (r?.status === 'succeeded' && r?.output?.[0]){
          done.push({ ...t, done:true, url:r.output[0]});
        } else {
          pending.push(t);
        }
      }
      setRoomTasks([...done, ...pending.filter(x=>!done.find(d=>d.id===x.id))]);
      setGallery(done.map(d=>({room:d.room, url:d.url})));
      if (done.length === roomTasks.length) clearInterval(h);
    }, 3500);
    return ()=> clearInterval(h);
  }, [roomTasks]);

  const handleDecorate = async () => {
    if (!plan) return alert('Upload plan first');
    const r = await decorate(plan, textures);
    setOverlayTask(r);
  };

  const handleVisualize = async () => {
    if (!plan) return alert('Upload plan first');
    const r = await visualize(plan, rooms, textures);
    setRoomTasks(r.tasks || []);
  };

  return (
    <div className="container">
      <div className="card">
        <h3>1) Загрузка плана</h3>
        <div className="row">
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files[0])}/>
          <button onClick={doUpload}>Загрузить</button>
        </div>
        {plan && <div className="grid"><img src={plan}/><span className="status">plan url: {plan}</span></div>}

        <h3>2) Материалы</h3>
        <div className="grid">
          <label>Стены (id): <input value={textures.wall} onChange={e=>setTextures({...textures, wall:e.target.value})}/></label>
          <label>Пол (id): <input value={textures.floor} onChange={e=>setTextures({...textures, floor:e.target.value})}/></label>
          <label>Двери (id): <input value={textures.doors} onChange={e=>setTextures({...textures, doors:e.target.value})}/></label>
          <label>Ткань (id): <input value={textures.fabric} onChange={e=>setTextures({...textures, fabric:e.target.value})}/></label>
          <div className="row"><button onClick={handleDecorate}>Сгенерировать дизайн поверх плана</button></div>
        </div>

        {overlayTask && <p className="status">task: {overlayTask.id} — ожидаем...</p>}
        {overlayImage && <div className="grid"><h4>Дизайн поверх плана</h4><img src={overlayImage}/></div>}

        <h3>3) Визуализация</h3>
        <p className="muted">Создать фото интерьера каждой комнаты на основе выбранных материалов</p>
        <div className="row"><button onClick={handleVisualize}>Визуализировать</button></div>
        <div className="thumbs">
          {gallery.map((g,i)=>(<div key={i}><div className="status">{g.room}</div><img src={g.url}/></div>))}
        </div>
      </div>

      <aside className="card">
        <h3>Справка по ID материалов</h3>
        <ul className="muted">
          <li>wall_paint_deep_green</li>
          <li>wall_stripes_green_black</li>
          <li>wall_marble_dark_green</li>
          <li>floor_planks_linear_olive</li>
          <li>floor_hex_black_green</li>
          <li>floor_terrazzo_black_green</li>
          <li>ceiling_offwhite_green_tint</li>
          <li>door_paint_dark_graphite</li>
          <li>door_paint_deep_green</li>
          <li>fabric_velvet_deep_green</li>
          <li>metal_brushed_blackened</li>
          <li>glass_frosted_green</li>
        </ul>
        <p className="muted">Подставь свои ID из catalog.json.</p>
      </aside>
    </div>
  )
}
