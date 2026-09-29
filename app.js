const state={students:[],rooms:[],payments:[],menu:[],facilities:[],dashboard:null};

const money=v=>`₹${Number(v).toLocaleString('en-IN')}`;
const initials=n=>n.split(' ').map(x=>x[0]).slice(0,2).join('');

const toast=msg=>{
  const e=document.querySelector('#toast');
  if(!e)return alert(msg);
  e.textContent=msg;
  e.classList.add('show');
  setTimeout(()=>e.classList.remove('show'),2800);
};

/* LOAD DATA */
async function loadData(){
  try{
    const[d,s,r,p,m,f]=await Promise.all([
      fetch('/api/dashboard').then(x=>x.json()),
      fetch('/api/students').then(x=>x.json()),
      fetch('/api/rooms').then(x=>x.json()),
      fetch('/api/payments').then(x=>x.json()),
      fetch('/api/menu').then(x=>x.json()),
      fetch('/api/facilities').then(x=>x.json())
    ]);
    Object.assign(state,{dashboard:d,students:s,rooms:r,payments:p,menu:m,facilities:f});
    renderDashboard();
    renderStudents();
    renderRooms();
    renderPayments();
    renderMenu();
    renderFacilities();
    populateRoomSelect();
  }catch(e){
    console.error(e);
    toast('Unable to connect to the hostel server.');
  }
}

/* FACILITIES */
function renderFacilities(){
  const grid=document.querySelector('#facilities-grid');
  if(!grid)return;

  grid.innerHTML=state.facilities.map(facility=>`
    <article class="facility-card">
      <span class="facility-icon">${facility.icon}</span>
      <div class="facility-content">
        <div class="facility-heading"><h2>${facility.name}</h2><span class="status-pill success">${facility.status}</span></div>
        <p>${facility.description}</p>
      </div>
    </article>
  `).join('');
}

/* DELETE STUDENT */
async function deleteStudent(id){
  if(!confirm('Are you sure you want to delete this student?'))return;

  try{
    const r=await fetch(`/api/students/${id}`,{method:'DELETE'});
    const result=await r.json();

    if(!r.ok){
      alert(result.message||'Failed to delete student.');
      return;
    }

    alert('Student deleted successfully!');
    loadData();
  }catch(e){
    console.error(e);
    alert('Server error. Please check the server.');
  }
}

/* DASHBOARD */
function renderDashboard(){
  if(!state.dashboard)return;

  const{occupied,capacity,availableBeds,collected,pending}=state.dashboard;
  const percent=capacity?Math.round(occupied/capacity*100):0;

  const set=(id,value)=>{
    const e=document.querySelector(id);
    if(e)e.textContent=value;
  };

  set('#occupancy-value',`${percent}%`);
  set('#beds-value',availableBeds);
  set('#collected-value',money(collected));
  set('#pending-value',money(pending));
  set('#donut-percent',`${percent}%`);
  set('#legend-occupied',occupied);
  set('#legend-available',availableBeds);
  set('#room-summary',`${occupied}/${capacity}`);
  set('#report-occupancy',`${percent}%`);
  set('#report-collection',money(collected));

  const progress=document.querySelector('#occupancy-progress');
  if(progress)progress.style.width=`${percent}%`;
}

/* STUDENTS */
function renderStudents(){
  const table=document.querySelector('#students-table');
  if(!table)return;

  table.innerHTML=state.students.map(s=>`
    <tr>
      <td>
        <div class="student-cell">
          <span class="table-avatar">${initials(s.name)}</span>
          ${s.name}
        </div>
      </td>
      <td class="course-text">${s.course}</td>
      <td><span class="room-chip">${s.room}</span></td>
      <td>
        <span class="status-pill ${s.status==='Active'?'success':'pending'}">
          ${s.status}
        </span>
      </td>
      <td>${s.joined}</td>
      <td>
        <button class="delete-btn" onclick="deleteStudent('${s.id}')">
          🗑️ Delete
        </button>
      </td>
    </tr>
  `).join('');
}

/* ROOMS */
function renderRooms(){
  const grid=document.querySelector('#rooms-grid');
  if(!grid)return;

  grid.innerHTML=state.rooms.map(r=>{
    const percent=r.capacity?r.occupied/r.capacity*100:0;

    return`
      <article class="panel room-card">
        <div class="room-head">
          <div>
            <h2>${r.number}</h2>
            <p>${r.type} · ${r.floor}</p>
          </div>
          <span class="room-status ${r.status.toLowerCase()}">${r.status}</span>
        </div>

        <div class="bed-track">
          <i style="width:${percent}%"></i>
        </div>

        <div class="room-foot">
          <span>${r.occupied} of ${r.capacity} beds occupied</span>
          <strong>${r.capacity-r.occupied} open</strong>
        </div>
      </article>
    `;
  }).join('');
}

/* PAYMENTS */
function renderPayments(){
  const table=document.querySelector('#payments-table');
  if(!table)return;

  table.innerHTML=state.payments.map(p=>`
    <tr>
      <td>${p.id}</td>
      <td>${p.student}</td>
      <td><span class="room-chip">${p.room}</span></td>
      <td>${money(p.amount)}</td>
      <td>${p.date}</td>
      <td>
        <span class="status-pill ${p.status==='Paid'?'success':'pending'}">
          ${p.status}
        </span>
      </td>
    </tr>
  `).join('');
}

/* HOSTEL MENU */
function renderMenu(){
  const table=document.querySelector('#menu-table');
  if(!table)return;

  table.innerHTML=state.menu.map(day=>`
    <tr>
      <td><strong>${day.day}</strong></td>
      <td><span class="meal-label breakfast">Breakfast</span>${day.breakfast}</td>
      <td><span class="meal-label lunch">Lunch</span>${day.lunch}</td>
      <td><span class="meal-label dinner">Dinner</span>${day.dinner}</td>
    </tr>
  `).join('');
}

/* ROOM SELECT */
function populateRoomSelect(){
  const select=document.querySelector('#room-select');
  if(!select)return;

  select.innerHTML=state.rooms
    .filter(r=>r.occupied<r.capacity)
    .map(r=>`
      <option value="${r.number}">
        ${r.number} · ${r.capacity-r.occupied} bed available
      </option>
    `).join('');
}

/* SWITCH VIEW */
function switchView(view){
  document.querySelectorAll('.view')
    .forEach(e=>e.classList.remove('active'));

  document.querySelector(`#${view}-view`)
    ?.classList.add('active');

  document.querySelectorAll('.nav-item')
    .forEach(e=>e.classList.toggle('active',e.dataset.view===view));

  const label=document.querySelector('#breadcrumb-label');
  if(label)label.textContent=view[0].toUpperCase()+view.slice(1);
}

/* NAVIGATION */
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click',()=>switchView(btn.dataset.view));
});

document.querySelectorAll('[data-view-target]').forEach(btn=>{
  btn.addEventListener('click',()=>switchView(btn.dataset.viewTarget));
});

/* MODALS */
document.querySelectorAll('[data-open-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelector(`#${btn.dataset.openModal}`)
      ?.classList.add('open');
  });
});

document.querySelectorAll('[data-close-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.closest('.modal-backdrop')?.classList.remove('open');
  });
});

document.querySelectorAll('.modal-backdrop').forEach(bg=>{
  bg.addEventListener('click',e=>{
    if(e.target===bg)bg.classList.remove('open');
  });
});

/* SEARCH */
document.querySelector('#student-search')?.addEventListener('input',e=>{
  const q=e.target.value.toLowerCase();

  document.querySelectorAll('#students-table tr').forEach(row=>{
    row.classList.toggle(
      'hidden',
      !row.textContent.toLowerCase().includes(q)
    );
  });
});

/* PRINT */
document.querySelector('#print-report')?.addEventListener(
  'click',()=>window.print()
);

/* FORM SUBMIT */
async function submitForm(form,url,modal,message){
  try{
    const response=await fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(Object.fromEntries(new FormData(form)))
    });

    if(!response.ok){
      toast('Please complete every field.');
      return;
    }

    form.reset();
    document.querySelector(modal)?.classList.remove('open');
    toast(message);
    loadData();
  }catch(e){
    console.error(e);
    toast('Unable to complete the request.');
  }
}

/* ADD STUDENT */
document.querySelector('#student-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  submitForm(
    e.target,
    '/api/students',
    '#student-modal',
    'Student registration created.'
  );
});

/* ADD PAYMENT */
document.querySelector('#payment-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  submitForm(
    e.target,
    '/api/payments',
    '#payment-modal',
    'Payment recorded successfully.'
  );
});

/* START */
loadData();