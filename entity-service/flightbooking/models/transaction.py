from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from flightbooking.models import Base
from flightbooking.utils import alchemy
import enum
from sqlalchemy.dialects.mysql import ENUM

class State(enum.Enum):
    not_paid = 0
    waiting_payment = 1
    paid = 2
    paid_not_valid = 3

class Transaction(Base):
    __tablename__ = 'transactions'

    transactionid = Column(Integer, primary_key=True, autoincrement=True)
    bookingid = Column(Integer, ForeignKey("bookings.bookingid"), nullable=False)
    paymentstate = Column('value', ENUM(State)) # 0=not paid, 1=waiting for payment, 2=paid, 3=payment not valid
    totalpayment = Column(Integer, nullable=False) 
    
    bookings = relationship("Booking", back_populates="transactions", cascade="all")
