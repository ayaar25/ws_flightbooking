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
from flightbooking.custom_exceptions import NoError, ResourceCreated, ResourceDeleted, ResourceNotFound
from .common import get_all, create, get_one, update, flightclass_to_string

class BookingsCollectionResource(BaseResource):
    """
    Handle for endpoint: /projects/{name}/experiments
    """
    def on_get(self, req, res):
        session = req.context['session']
        q_bookings = session.query(Booking)
        session = req.context['session']
        result = get_all(
            name='bookings',
            query=q_bookings.filter_by(isdelete=False),
            attributes=["bookingid","email", "flightnumber",
                        "scheduleid", "numberofseats", "flightclass"]
        )


        res.status = falcon.HTTP_OK
        res.media = result

    # @validate(load_schema('create_booking'))
    def on_post(self,req,res):
        session = req.context['session']

        data = req.media
        attributes = [
            "email", "flightnumber", "scheduleid", "numberofseats", "flightclass"
        ]
        for attr in attributes:
            if data.get(attr) == None:
                raise falcon.HTTPMissingParam(attr)
        
        q_passanger = session.query(Passanger).filter_by(email=data.get('email')).first()
        if q_passanger is None:
            raise ResourceNotFound("Passanger")

        q_airline = session.query(Airline).filter_by(flightnumber=data.get('flightnumber')).first()
        if q_airline is None:
            raise ResourceNotFound("Airline")

        q_schedule = session.query(Schedule).filter_by(scheduleid=data.get('scheduleid')).first()
        if q_schedule is None:
            raise ResourceNotFound("Schedule")

        try:
            if (q_schedule.__dict__['seats' + data.get('flightclass')]-data.get(
                    'numberofseats') < 0):
                raise ResourceNotFound('Seat')
            booking = Booking(
                email=data.get('email'),
                flightnumber=data.get('flightnumber'),
                scheduleid=data.get('scheduleid'),
                numberofseats=data.get('numberofseats'),
                flightclass=data.get('flightclass')
            )
            result = create(
                session=session,
                resource=booking,
                attributes=attributes
            )
            session.flush()
            result_2 = create(
                session=session,
                resource=Transaction(
                    bookingid=booking.bookingid,
                    paymentstate=0,
                    totalpayment=data.get(
                        'numberofseats') * q_schedule.__dict__['price'+data.get('flightclass')]
                ),
                attributes=["bookingid", "paymentstate", "totalpayment"]
            )
            result_3 = update(
                data={
                    'seats' + data.get('flightclass'): q_schedule.__dict__['seats' + data.get('flightclass')]-data.get(
                        'numberofseats')
                },
                session=session,
                query=session.query(Schedule),
                attributes=[
                    "seatsfirst", "seatsbusiness", "seatseconomy"
                ]
            )
            result.update({
                'totalpayment' : result_2['data']['totalpayment']
            })
        except Exception as e:
            if isinstance(e, ResourceNotFound):
                raise e
            raise falcon.HTTPBadGateway()

        res.status = falcon.HTTP_CREATED
        res.media = result

class BookingsResource(BaseResource):
    def on_get(self, req, res, bookingid):
        session = req.context['session']
        q_booking = session.query(Booking).filter_by(
            bookingid=bookingid, isdelete=False).first()
        if q_booking is None:
            raise ResourceNotFound('Booking')

        result = get_one(
            query=q_booking,
            attributes=["bookingid","email", "flightnumber",
                        "scheduleid", "numberofseats", "flightclass"]
        )
        res.status = falcon.HTTP_200
        res.media = result

    def on_delete(self, req, res, bookingid):
        session = req.context['session']
        q_booking = session.query(Booking).filter_by(
            bookingid=bookingid, isdelete=False).first()
        if q_booking is None:
            raise ResourceNotFound('Booking')

        result = update(
            data={
                'isdelete': True
            },
            session=session,
            query=session.query(Booking).filter_by(bookingid=bookingid),
            attributes=["isdelete"]
        )

        res.status = falcon.HTTP_200
        res.media = result
