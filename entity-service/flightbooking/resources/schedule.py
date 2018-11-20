import falcon
import time, datetime
from sqlalchemy import text, func
from sqlalchemy.orm.exc import NoResultFound
from falcon.media.validators.jsonschema import validate
from flightbooking import log
from flightbooking.schemas import load_schema
from flightbooking.resources import BaseResource
from flightbooking.models import Airline, Passanger, Booking, Schedule, Transaction
from flightbooking.exceptions import AppError, InvalidParameterError, UserNotExistsError, PasswordNotMatch
from flightbooking.custom_exceptions import NoError, ResourceCreated, ResourceDeleted, ResourceNotFound, ResourceAlreadyExisted
from .common import get_all, create, get_one, update

def date_to_string(dt):
    if isinstance(dt, datetime.datetime):
        return "{}-{}-{}T{}:{}:{}".format(dt.day, dt.month, dt.year, dt.hour, dt.minute, dt.second)

class SchedulesCollectionResource(BaseResource):
    def on_get(self, req, res):
        session = req.context['session']
        if len(req.params) > 0:
            q = session.query(Schedule)
            for k,v in req.params.items():
                q = q.filter(getattr(Schedule, k).like("%%%s%%" % v))
            result = get_all(
                name='schedules',
                query=q,
                attributes=["flightnumber", "departurefrom",
                            "departureto", "pricefirst", "pricebusiness", "priceeconomy"]

            )
        else:
            result = get_all(
                name='schedules',
                query=session.query(Schedule),
                attributes=["flightnumber", "departurefrom",
                            "departureto", "pricefirst", "pricebusiness", "priceeconomy"]
            )

        res.status = falcon.HTTP_OK
        res.media = result

    # @validate(load_schema('create_schedule'))
    def on_post(self,req,res):
        session = req.context['session']
        data = req.media
        attributes = [
            "flightnumber", "departuretime", "departurefrom", "departureto", "pricefirst", "pricebusiness", "priceeconomy"
        ]
        for attr in attributes:
            if data.get(attr) == None:
                raise falcon.HTTPMissingParam(attr)
        
        q_airline = session.query(Airline).filter_by(flightnumber=data.get('flightnumber')).first()
        if q_airline is None:
            raise ResourceNotFound("Airline")
        q_schedule = session.query(Schedule).filter_by(flightnumber=data.get(
            'flightnumber'),  departuretime=data.get('departuretime'), departurefrom=data.get('departurefrom'), departureto=data.get('departureto')).first()
        if q_schedule is not None:
            raise ResourceAlreadyExisted("Schedule")
        
        try:
            result = create(
                session=session,
                resource=Schedule(
                    flightnumber=data.get('flightnumber'),
                    departuretime=datetime.datetime.strptime(
                        data.get('departuretime'), "%Y-%m-%d %I:%M"),
                    departurefrom=data.get('departurefrom'),
                    departureto=data.get('departureto'),
                    pricefirst=data.get('pricefirst'),
                    pricebusiness=data.get('pricebusiness'),
                    priceeconomy=data.get('priceeconomy'),
                    seatsfirst=q_airline.__dict__['seatsfirst'],
                    seatsbusiness=q_airline.__dict__['seatsbusiness'],
                    seatseconomy=q_airline.__dict__['seatseconomy'],
                ),
                attributes=attributes
            )
        except:
            raise falcon.HTTPBadGateway()

        res.status = falcon.HTTP_CREATED
        res.media = result

class SchedulesResource(BaseResource):
    def on_get(self, req, res, scheduleid):
        session = req.context['session']
        q_schedule = session.query(Schedule).filter_by(
            scheduleid=scheduleid).first()
        if q_schedule is None:
            raise ResourceNotFound("Schedule")
        result = get_one(
            query=q_schedule,
            attributes=["flightnumber", "departuretime", "departurefrom", "departureto", "pricefirst", "pricebusiness", "priceeconomy", "seatsfirst", "seatsbusiness", "seatseconomy"])
        res.status = falcon.HTTP_200
        res.media = result

    def on_put(self, req, res, scheduleid):
        session = req.context['session']
        data = req.media

        q_schedule = session.query(Schedule).filter_by(
            scheduleid=scheduleid).first()
        if q_schedule is None:
            raise ResourceNotFound("Schedule")
        
        result = update(
            data=data,
            session=session,
            query=session.query(Schedule),
            attributes=[
                "departuretime", "pricefirst", "pricebusiness", "priceeconomy"
            ]
        )

        res.status = falcon.HTTP_200
        res.media = result