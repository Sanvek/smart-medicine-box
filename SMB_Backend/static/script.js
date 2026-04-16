// ===== BASE URL FIX (CRITICAL) =====
const BASE_URL = window.location.origin;

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2000);
}

// ===== SET ALARM =====
function setupForm() {
  const form = document.getElementById("alarmForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hour = document.getElementById("hour").value;
    const minute = document.getElementById("minute").value;
    const compartment = document.getElementById("compartment").value;

    try {
      const res = await fetch(BASE_URL + "/setAlarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hour: parseInt(hour),
          minute: parseInt(minute),
          compartment: parseInt(compartment),
        }),
      });

      if (res.ok) {
        showToast("Alarm Added ✅");
        loadAlarms();
      } else {
        showToast("Failed to add ❌");
      }

    } catch (err) {
      console.log("SET ALARM ERROR:", err);
      showToast("Server error ❌");
    }
  });
}

// ===== LOAD ALARMS =====
async function loadAlarms() {
  try {
    const res = await fetch(BASE_URL + "/getAlarms");
    const data = await res.json();

    const table = document.getElementById("alarmsTableBody");
    if (!table) return;

    table.innerHTML = "";

    if (!data || data.length === 0) {
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

  } catch (err) {
    console.log("LOAD ALARMS ERROR:", err);
  }
}

// ===== DELETE =====
async function deleteAlarm(id) {
  const confirmDelete = confirm("Delete this alarm?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(BASE_URL + "/deleteAlarm/" + id, {
      method: "DELETE"
    });

    if (res.ok) {
      showToast("Deleted ✅");
      loadAlarms();
    } else {
      showToast("Delete failed ❌");
    }

  } catch (err) {
    console.log("DELETE ERROR:", err);
    showToast("Server error ❌");
  }
}

// ===== LOAD LOGS =====
async function loadLogs() {
  try {
    const res = await fetch(BASE_URL + "/getLogs");
    const data = await res.json();

    const logsDiv = document.getElementById("logsList");
    if (!logsDiv) return;

    logsDiv.innerHTML = "";

    if (!data || data.length === 0) {
      logsDiv.innerHTML = `<div>No logs</div>`;
      return;
    }

    data.slice().reverse().forEach(log => {
      logsDiv.innerHTML += `
        <div>⏰ ${log.time} | Box ${log.compartment} → ${log.status}</div>
      `;
    });

  } catch (err) {
    console.log("LOAD LOGS ERROR:", err);
  }
}

// ===== ANALYTICS =====
async function loadAnalytics() {
  try {
    const res = await fetch(BASE_URL + "/getLogs");
    const data = await res.json();

    let taken = 0, missed = 0;
    let compartmentStats = {1:0, 2:0, 3:0};

    if (data && data.length > 0) {
      data.forEach(log => {
        if (log.status === "taken") {
          taken++;
          compartmentStats[log.compartment]++;
        }
        if (log.status === "missed") missed++;
      });
    }

    // ===== EXISTING ELEMENTS =====
    const takenEl = document.getElementById("takenCount");
    const missedEl = document.getElementById("missedCount");

    if (takenEl) takenEl.innerText = taken;
    if (missedEl) missedEl.innerText = missed;

    // ===== FIXED TOTAL COUNT =====
    const totalElOld = document.getElementById("totalCount"); // keep old (no removal)
    if (totalElOld) totalElOld.innerText = data.length;

    const totalEl = document.getElementById("totalLogsCount"); // correct one
    if (totalEl) totalEl.innerText = data.length;

    // ===== BEST / ATTENTION =====
    let best = "No data";
    let attention = "No data";

    if (data.length > 0) {
      let maxComp = Object.keys(compartmentStats).reduce((a, b) => 
        compartmentStats[a] > compartmentStats[b] ? a : b
      );

      best = "Compartment " + maxComp;
      attention = missed > 0 ? "Missed doses present" : "All taken";
    }

    const bestEl = document.getElementById("bestMetric");
    const attEl = document.getElementById("attentionMetric");

    if (bestEl) bestEl.innerText = best;
    if (attEl) attEl.innerText = attention;

    // ===== COMPARTMENT SUMMARY =====
    const compDiv = document.getElementById("compartmentStats");
    if (compDiv) {
      compDiv.innerHTML = `
        <div class="mini-stat">Compartment 1: ${compartmentStats[1]}</div>
        <div class="mini-stat">Compartment 2: ${compartmentStats[2]}</div>
        <div class="mini-stat">Compartment 3: ${compartmentStats[3]}</div>
      `;
    }

  } catch (err) {
    console.log("ANALYTICS ERROR:", err);
  }
}

// ===== INIT =====
window.onload = () => {
  setupForm();
  loadAlarms();
  loadLogs();
  loadAnalytics();
};