from flask import Flask, render_template, request, jsonify
from datetime import datetime
import sqlite3
import pytz   # ✅ ADD THIS

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # Alarms table 
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hour INTEGER,
        minute INTEGER,
        compartment INTEGER,
        status TEXT DEFAULT 'pending'
    )
    """)

    # Logs table 
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TEXT,
        compartment INTEGER,
        status TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

@app.route('/')
def Home():
    return render_template("index.html")


# SET ALARM 
@app.route("/setAlarm", methods=["POST"])
def set_alarm():
    data = request.json

    hour = data["hour"]
    minute = data["minute"]
    compartment = data["compartment"]

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO alarms (hour, minute, compartment, status)
        VALUES (?, ?, ?, 'pending')
    """, (hour, minute, compartment))

    conn.commit()
    conn.close()

    return jsonify({"message": "Alarm added"})


# GET ALL ALARMS 
@app.route("/getAlarms", methods=["GET"])
def get_alarms():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM alarms")
    alarms = cursor.fetchall()

    conn.close()

    result = []
    for a in alarms:
        result.append({
            "id": a[0],
            "hour": a[1],
            "minute": a[2],
            "compartment": a[3],
            "status": a[4]
        })

    return jsonify(result)


#  GET NEXT ALARM (ONLY PENDING)


@app.route('/getNextAlarm')
def get_next_alarm():
    # ✅ FORCE IST TIMEZONE
    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist)

    current_minutes = now.hour * 60 + now.minute

    print("Current IST Time:", now.hour, ":", now.minute)  # 🔥 DEBUG

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    cursor.execute("""
        SELECT hour, minute, compartment 
        FROM alarms 
        WHERE status = 'pending'
    """)
    
    alarms = cursor.fetchall()

    print("All alarms:", alarms)  # 🔥 DEBUG

    best = None
    min_diff = 99999

    for h, m, c in alarms:
        alarm_minutes = h * 60 + m
        diff = alarm_minutes - current_minutes

        print(f"Checking → {h}:{m} diff={diff}")  # 🔥 DEBUG
        
        if diff < 0:
            diff += 24 * 60  # Wrap around to the next day

        if diff >= 0 and diff < min_diff:
            min_diff = diff
            best = (h, m, c)

    conn.close()

    print("Selected alarm:", best)  # 🔥 DEBUG

    if best:
        return {
            "hour": best[0],
            "minute": best[1],
            "compartment": best[2]
        }
    else:
        return {}


# STATUS LOG
@app.route("/status", methods=["POST"])
def status():
    data = request.json

    time = data["time"]
    compartment = data["compartment"]
    status = data["status"]

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO logs (time, compartment, status) 
        VALUES (?, ?, ?)
    """, (time, compartment, status))

    conn.commit()
    conn.close()

    return jsonify({"message": "Status saved"})


# UPDATE ALARM STATUS
@app.route("/updateAlarmStatus", methods=["POST"])
def update_alarm_status():
    data = request.json

    hour = data["hour"]
    minute = data["minute"]
    compartment = data["compartment"]
    status = data["status"]

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE alarms
        SET status = ?
        WHERE hour = ? AND minute = ? AND compartment = ? AND status = 'pending'
    """, (status, hour, minute, compartment))

    conn.commit()
    conn.close()

    return jsonify({"message": "Alarm updated"})


@app.route("/getLogs", methods=["GET"])
def get_logs():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 20")
    logs = cursor.fetchall()

    conn.close()

    result = []
    for l in logs:
        result.append({
            "id": l[0],
            "time": l[1],
            "compartment": l[2],
            "status": l[3]
        })

    return jsonify(result)

@app.route("/deleteAlarm/<int:id>", methods=["DELETE"])
def delete_alarm(id):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("DELETE FROM alarms WHERE id = ?", (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Alarm deleted"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)