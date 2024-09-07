import sqlite3
import streamlit as st

st.title('Data Viewer')

conn = sqlite3.connect('data.db')
cursor = conn.cursor()

cursor.execute('SELECT * FROM data')
rows = cursor.fetchall()

for row in rows:
    st.write(row[1])

conn.close()
