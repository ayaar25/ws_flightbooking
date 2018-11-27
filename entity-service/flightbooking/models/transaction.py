from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from flightbooking.models import Base
from flightbooking.utils import alchemy

class Transaction(Base):
    __tablename__ = 'transactions'

    transactionid = Column(Integer, primary_key=True, autoincrement=True)
    bookingid = Column(Integer, ForeignKey("bookings.bookingid"), nullable=False)
    paymentstate = Column(String(1), nullable=False)
    totalpayment = Column(Integer, nullable=False) #0=not paid, 1=waiting for payment, 2=paid, 3=payment not valid
    
    bookings = relationship("Booking", back_populates="transactions", cascade="all")
