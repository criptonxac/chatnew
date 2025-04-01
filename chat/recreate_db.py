from sqlalchemy import create_engine, text
from db import DATABASE_URL

def recreate_database():
    # Ma'lumotlar bazasiga ulanish
    engine = create_engine(DATABASE_URL)
    conn = engine.connect()
    
    # Tranzaksiyani boshlash
    trans = conn.begin()
    
    try:
        # Barcha jadvallarni o'chirish
        conn.execute(text("DROP TABLE IF EXISTS messages CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS conversation_participants CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS conversations CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        
        # Tranzaksiyani yakunlash
        trans.commit()
        print("Barcha jadvallar muvaffaqiyatli o'chirildi")
    except Exception as e:
        # Xatolik bo'lsa, tranzaksiyani bekor qilish
        trans.rollback()
        print(f"Xatolik yuz berdi: {e}")
    finally:
        # Ulanishni yopish
        conn.close()

if __name__ == "__main__":
    recreate_database()
