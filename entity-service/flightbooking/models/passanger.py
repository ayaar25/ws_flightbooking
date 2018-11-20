from sqlalchemy import func
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from flightbooking.models import Base
from flightbooking.utils import alchemy

class Passanger(Base):
    __tablename__ = "passangers"

    passangerid = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    origin = Column(String(50), nullable=False)
    phonenumber = Column(String(12), nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    dob = Column(DateTime, default=func.now(), nullable=False)
    sex = Column(String(1), nullable=False)
    nationality = Column(String(50), nullable=False)

    bookings = relationship("Booking", back_populates="passangers")