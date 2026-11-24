const STORAGE_KEY = "sms_students_v1";
const sampleStudents = [
  {id:"s1",name:"Aarav Sharma",roll:"CSE2026001",email:"aarav.sharma@example.com",department:"Computer Science",year:"3rd Year",attendance:92,status:"Active"},
  {id:"s2",name:"Diya Nair",roll:"IT2026007",email:"diya.nair@example.com",department:"Information Technology",year:"2nd Year",attendance:86,status:"Active"},
  {id:"s3",name:"Rohan Patel",roll:"ECE2026012",email:"rohan.patel@example.com",department:"Electronics",year:"3rd Year",attendance:74,status:"Active"},
  {id:"s4",name:"Meera Das",roll:"ME2026021",email:"meera.das@example.com",department:"Mechanical",year:"1st Year",attendance:68,status:"Inactive"}
];
const $ = id => document.getElementById(id);
let students = loadStudents();

function loadStudents(){
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : [...sampleStudents]; }
  catch(error){ console.error("Could not read saved records", error); return [...sampleStudents]; }
}
function saveStudents(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); }
function escapeHTML(value){ return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])); }
function render(){
  const query = $("searchInput").value.trim().toLowerCase();
  const dept = $("departmentFilter").value;
  const status = $("statusFilter").value;
  const filtered = students.filter(s => {
    const matches = [s.name,s.roll,s.email].some(v => v.toLowerCase().includes(query));
    return matches && (!dept || s.department === dept) && (!status || s.status === status);
  });
  $("studentTableBody").innerHTML = filtered.map(s => `
    <tr>
      <td><strong>${escapeHTML(s.roll)}</strong></td>
      <td><div class="student-name">${escapeHTML(s.name)}</div><div class="student-email">${escapeHTML(s.email)}</div></td>
      <td>${escapeHTML(s.department)}</td><td>${escapeHTML(s.year)}</td>
      <td>${Number(s.attendance)}%</td>
      <td><span class="pill ${s.status === "Active" ? "active" : "inactive"}">${escapeHTML(s.status)}</span></td>
      <td><div class="actions"><button class="small-btn" data-action="edit" data-id="${escapeHTML(s.id)}">Edit</button><button class="small-btn delete-btn" data-action="delete" data-id="${escapeHTML(s.id)}">Delete</button></div></td>
    </tr>`).join("");
  $("emptyState").hidden = filtered.length !== 0;
  $("totalCount").textContent = students.length;
  $("activeCount").textContent = students.filter(s=>s.status==="Active").length;
  $("departmentCount").textContent = new Set(students.map(s=>s.department)).size;
  const avg = students.length ? Math.round(students.reduce((sum,s)=>sum+Number(s.attendance),0)/students.length) : 0;
  $("averageAttendance").textContent = `${avg}%`;
  updateDepartmentOptions();
}
function updateDepartmentOptions(){
  const select = $("departmentFilter"), current = select.value;
  const departments = [...new Set(students.map(s=>s.department))].sort();
  select.innerHTML = '<option value="">All departments</option>' + departments.map(d=>`<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join("");
  select.value = departments.includes(current) ? current : "";
}
function openForm(student){
  $("studentForm").reset(); $("formError").textContent = "";
  $("studentId").value = student?.id || "";
  $("dialogTitle").textContent = student ? "Edit student" : "Add student";
  $("fullName").value = student?.name || "";
  $("rollNo").value = student?.roll || "";
  $("email").value = student?.email || "";
  $("department").value = student?.department || "";
  $("year").value = student?.year || "";
  $("attendance").value = student?.attendance ?? 85;
  $("status").value = student?.status || "Active";
  $("studentDialog").showModal();
}
function closeForm(){ $("studentDialog").close(); }
function notify(message){
  $("toast").textContent = message; $("toast").classList.add("show");
  window.setTimeout(()=> $("toast").classList.remove("show"), 2200);
}
$("addStudentBtn").addEventListener("click",()=>openForm());
$("closeDialogBtn").addEventListener("click",closeForm);
$("cancelBtn").addEventListener("click",closeForm);
["searchInput","departmentFilter","statusFilter"].forEach(id=>$(id).addEventListener("input",render));
$("studentTableBody").addEventListener("click",event=>{
  const button = event.target.closest("button[data-action]"); if(!button) return;
  const student = students.find(s=>s.id===button.dataset.id); if(!student) return;
  if(button.dataset.action==="edit") openForm(student);
  if(button.dataset.action==="delete" && confirm(`Delete ${student.name}'s record?`)){
    students = students.filter(s=>s.id!==student.id); saveStudents(); render(); notify("Student record deleted.");
  }
});
$("studentForm").addEventListener("submit",event=>{
  event.preventDefault();
  const record = {
    id:$("studentId").value || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name:$("fullName").value.trim(), roll:$("rollNo").value.trim().toUpperCase(),
    email:$("email").value.trim(), department:$("department").value, year:$("year").value,
    attendance:Number($("attendance").value), status:$("status").value
  };
  if(!record.name || !record.roll || !record.email){ $("formError").textContent="Please complete all required fields."; return; }
  if(!Number.isFinite(record.attendance) || record.attendance<0 || record.attendance>100){ $("formError").textContent="Attendance must be between 0 and 100."; return; }
  const duplicate = students.some(s=>s.roll.toLowerCase()===record.roll.toLowerCase() && s.id!==record.id);
  if(duplicate){ $("formError").textContent="This roll number already exists."; return; }
  const index = students.findIndex(s=>s.id===record.id);
  if(index>=0) students[index]=record; else students.push(record);
  saveStudents(); render(); closeForm(); notify(index>=0 ? "Student record updated." : "Student added successfully.");
});
$("exportBtn").addEventListener("click",()=>{
  const headers=["Roll Number","Name","Email","Department","Academic Year","Attendance","Status"];
  const rows=students.map(s=>[s.roll,s.name,s.email,s.department,s.year,s.attendance,s.status]);
  const csv=[headers,...rows].map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob), link=document.createElement("a");
  link.href=url; link.download="student-records.csv"; link.click(); URL.revokeObjectURL(url);
  notify("CSV export downloaded.");
});
$("resetDemoBtn").addEventListener("click",()=>{
  if(confirm("Replace current records with the original demo students?")){
    students=[...sampleStudents]; saveStudents(); $("searchInput").value=""; $("statusFilter").value="";
    render(); notify("Demo data restored.");
  }
});
render();
