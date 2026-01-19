import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')

def check_db():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute('SELECT "title", "locations" FROM books WHERE source = %s LIMIT 50', ('bibliometro',))
        rows = cur.fetchall()
        
        found = False
        print(f"🔎 Checked {len(rows)} rows.")
        for row in rows:
            title = row[0]
            locs = row[1]
            if locs:
                print(f"✅ FOUND: {title}")
                print(f"   📍 Locations: {locs}")
                found = True
        
        if not found:
            print("❌ No locations found in any row.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
