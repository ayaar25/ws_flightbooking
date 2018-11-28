import falcon
import time
from sqlalchemy import text, func
from sqlalchemy.orm.exc import NoResultFound
from falcon.media.validators.jsonschema import validate
from flightbooking import log
from flightbooking.schemas import load_schema
from flightbooking.resources import BaseResource
from flightbooking.models import Airline, Passanger, Booking, Schedule, Transaction
from flightbooking.exceptions import AppError, InvalidParameterError, UserNotExistsError, PasswordNotMatch
from flightbooking.custom_exceptions import NoError, ResourceCreated, ResourceDeleted, ResourceNotFound,ResourceAlreadyExisted
from .common import get_all, create, get_one, update

class TransactionsCollectionResource(BaseResource):
    def on_get(self, req, res):

        session = req.context['session']
        result = get_all(
            name='transactions',
            query=session.query(Transaction),
            attributes=["transactionid", "bookingid", "paymentstate","totalpayment"]
        )

        res.status = falcon.HTTP_OK
        res.media = result

    def on_post(self,req,res):
        session = req.context['session']

        data = req.media
        attributes = [
            "bookingid", "paymentstate", "totalpayment"
        ]
        for attr in attributes:
            if data.get(attr) == None:
                raise falcon.HTTPMissingParam(attr)

        # q_booking = session.query(Booking).filter_by(bookingid=data.get('bookingid')).first()
        # if q_booking is not None:
        #     raise ResourceAlreadyExisted("Booking")

        try:
            transaction = Transaction(
                bookingid=data.get("bookingid"),
                paymentstate=data.get("paymentstate"),
                totalpayment=data.get("totalpayment")
            )
            result = create(
                session=session, 
                resource=transaction,
                attributes=attributes
            )
            session.flush()
            print(result)
            result['data']['transactionid'] = transaction.transactionid
        except:
            raise falcon.HTTPBadGateway()
    
        res.status = falcon.HTTP_CREATED
        res.media = result

class TransactionsResource(BaseResource):
    def on_get(self, req, res, transactionid):
        session = req.context['session']
        q_transaction = session.query(Transaction).filter_by(
            transactionid=transactionid).first()
        if q_transaction is None:
            raise ResourceNotFound("Transaction")
        result = get_one(query=q_transaction, attributes=["transactionid", "bookingid", "paymentstate"])
        res.status = falcon.HTTP_200
        res.media = result

    def on_put(self, req, res, transactionid):
        session = req.context['session']
        data = req.media

        q_transaction = session.query(Transaction).filter_by(
            transactionid=transactionid).first()
        if q_transaction is None:
            raise ResourceNotFound("Transaction")

        result = update(
            data=data,
            session=session,
            query=session.query(Transaction).filter_by(transactionid=transactionid),
            attributes=[
                "paymentstate"
            ]
        )

        res.status = falcon.HTTP_200
        res.media = result
