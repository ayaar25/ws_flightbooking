from sqlalchemy import func
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer, Boolean, DateTime, Time
from sqlalchemy.orm import relationship
from flightbooking.models import Base
from flightbooking.utils import alchemy

class Schedule(Base):
    __tablename__ = "schedules"

    scheduleid = Column(Integer, primary_key=True, autoincrement=True)
    flightnumber = Column(String(10), ForeignKey("airlines.flightnumber"), nullable=False)
    departuretime = Column(DateTime, nullable=False)
    departurefrom = Column(String(50), nullable=False)
    departureto = Column(String(50), nullable=False)
    pricefirst = Column(Integer, default=0)
    pricebusiness = Column(Integer, default=0)
    priceeconomy = Column(Integer, nullable=False)
   	seatsfirst = Column(Integer)
    seatsbusiness = Column(Integer)
    seatseconomy = Column(Integer, nullable=False)
    
    airlines = relationship("Airline", back_populates="schedules")
    bookings = relationship("Booking", back_populates="schedules")
