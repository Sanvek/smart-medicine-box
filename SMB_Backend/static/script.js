const BASE_URL = "http://10.241.114.172:5000";

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2000);
}

// ===== SET ALARM =====
document.getElementById("alarmForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const hour = document.getElementById("hour").value;
  const minute = document.getElementById("minute").value;
  const compartment = document.getElementById("compartment").value;

  const res = await fetch(BASE_URL + "/setAlarm", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      hour: parseInt(hour),
      minute: parseInt(minute),
      compartment: parseInt(compartment),
    }),
  });

  if (res.ok) {
    showToast("Alarm Added ✅");
    loadAlarms();
  }
});

// ===== LOAD ALARMS =====
async function loadAlarms() {
  const res = await fetch(BASE_URL + "/getAlarms");
  const data = await res.json();

  const table = document.getElementById("alarmsTableBody");
  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = `<tr><td colspan="4">No alarms</td></tr>`;
    return;
  }

  data.forEach(alarm => {
    const row = `
      <tr>
        <td>${alarm.hour}:${alarm.minute < 10 ? "0" : ""}${alarm.minute}</td>
        <td>${alarm.compartment}</td>
        <td>${alarm.status}</td>
        <td>
          <button onclick="deleteAlarm(${alarm.id})">Delete</button>
        </td>
      </tr>
    `;
    table.innerHTML += row;
  });
}

// ===== DELETE (TEMP DISABLED IF ROUTE NOT EXISTS) =====
async function deleteAlarm(id) {
  const confirmDelete = confirm("Delete this alarm?");
  if (!confirmDelete) return;

  const res = await fetch(BASE_URL + "/deleteAlarm/" + id, {
    method: "DELETE"
  });

  if (res.ok) {
    showToast("Deleted ✅");
    loadAlarms();
  } else {
    showToast("Delete failed ❌");
  }
}

// ===== LOAD LOGS =====
async function loadLogs() {
  try {
    const res = await fetch(BASE_URL + "/getLogs");
    const data = await res.json();

    const logsDiv = document.getElementById("logsList");
    logsDiv.innerHTML = "";

    if (data.length === 0) {
      logsDiv.innerHTML = `<div>No logs</div>`;
      return;
    }

    data.reverse().forEach(log => {
      logsDiv.innerHTML += `
        <div>⏰ ${log.time} | Box ${log.compartment} → ${log.status}</div>
      `;
    });
  } catch {
    console.log("Logs route not ready");
  }
}

// ===== ANALYTICS =====
async function loadAnalytics() {
  try {
    const res = await fetch(BASE_URL + "/getLogs");
    const data = await res.json();

    let taken = 0, missed = 0;

    data.forEach(log => {
      if (log.status === "taken") taken++;
      if (log.status === "missed") missed++;
    });

    document.getElementById("takenCount").innerText = taken;
    document.getElementById("missedCount").innerText = missed;
    document.getElementById("totalCount").innerText = data.length;
  } catch {}
}

// ===== INIT =====
window.onload = () => {
  loadAlarms();
  loadLogs();
  loadAnalytics();
};