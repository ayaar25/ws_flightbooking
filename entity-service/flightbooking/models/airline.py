from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer, Boolean, BigInteger, SmallInteger, TIMESTAMP, Text
from sqlalchemy.orm import relationship
from flightbooking.models import Base
from flightbooking.utils import alchemy

class Airline(Base):
    __tablename__ = "airlines"

    flightnumber = Column(String(10), primary_key=True)
    name = Column(String(50), nullable=False)
    origin = Column(String(50), nullable=False)
    
    bookings = relationship("Booking", back_populates="airlines")
    schedules = relationship("Schedule", back_populates="airlines")
