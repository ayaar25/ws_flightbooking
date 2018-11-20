from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from flightbooking.models import Base
from flightbooking.utils import alchemy
import enum
from sqlalchemy.dialects.mysql import ENUM

class FlightClass(enum.Enum):
    first = 1
    business = 2
    economy = 3

class Booking(Base):
    __tablename__ = "bookings"

    bookingid = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(50), ForeignKey("passangers.email"), nullable=False)
    flightnumber = Column(String(10), ForeignKey("airlines.flightnumber"), nullable=False)
    scheduleid = Column(Integer, ForeignKey("schedules.scheduleid"), nullable=False)
    numberofseats = Column(Integer, nullable=False)
    flightclass = Column('value', ENUM(FlightClass))
    isdelete = Column(Boolean, nullable=False, default=False)
    
    airlines = relationship("Airline", back_populates="bookings")
    passangers = relationship("Passanger", back_populates="bookings")
    schedules = relationship("Schedule", back_populates="bookings")
    transactions = relationship("Transaction", back_populates="bookings")
