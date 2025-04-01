from sqlalchemy.orm import Session
from schemas import UserCreate, RoleCreate
from models import User, Role, UserRole, Message


def create_user(db: Session, user:UserCreate):
    db_user = User(
        
        name=  user.name,
        email= user.email,
        password =  user.password,
        hashed_password = user.hashed_password,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: UserCreate):
    user = db.query(User).filter(User.id == user_id).first()
    
    if user:
       
        user.name = user_update.name
        user.email = user_update.email
        user.password = user_update.password
        user.hashed_password = "hashed_" + user_update.password
        
        db.commit()
        db.refresh(user) 
        return user
    return None


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False



def create_role(db: Session, user_id:int):
    return db.query(User) .filter(User.id == user_id).first()


def create_role(db: Session, role:RoleCreate):
    
    db.role = Role(
        
        name= role.name,
        description= role.description
        
    )
    db.add(db.role)
    db.commit()
    db.refresh(db.role)
    return db.role

def create_messages(db: Session, sender:str, content:str):
    message =Message(sender = sender, content=content)
    db. add(message)
    db.commit()
    db.refresh(message)
    return message


def get_last_message(db:Session, limit:int=30):
    return db.query(Message).order_by(Message.timestamp.desc()).limit(limit).all()

