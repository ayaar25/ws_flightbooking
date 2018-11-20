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
from flightbooking.custom_exceptions import NoError, ResourceCreated, ResourceNotFound, ResourceAlreadyExisted
from .common import get_all, create, get_one

class AirlinesCollectionResource(BaseResource):
    def on_get(self, req, res):
        session = req.context['session']

        q_airlines = session.query(Airline)
        session = req.context['session']
        result = get_all(
            name='airlines', 
            query=q_airlines, 
            attributes=["flightnumber", "name",
                        "origin", "seatsfirst", "seatsbusiness", "seatseconomy"]
            )

        res.status = falcon.HTTP_OK
        res.media = result

    #@validate(load_schema('create_airline'))
    def on_post(self,req,res):
        session = req.context['session']


        data = req.media
        attributes = [
            "flightnumber", "origin", "name", "seatsfirst", "seatsbusiness", "seatseconomy"
        ]
        for attr in attributes:
            if data.get(attr) == None:
                raise falcon.HTTPMissingParam(attr)

        q_airline = session.query(Airline).filter_by(flightnumber = data.get("flightnumber")).first()
        if q_airline is not None:
            raise ResourceAlreadyExisted("Airline")
        
        try:
            result = create(
                session=session, 
                resource=Airline(
                    flightnumber=data.get("flightnumber"),
                    origin=data.get("origin"),
                    name=data.get("name"),
                    seatsfirst=data.get("seatsfirst"),
                    seatsbusiness=data.get("seatsbusiness"),
                    seatseconomy=data.get("seatseconomy")
                ),
                attributes=attributes
            )
        except:
            raise falcon.HTTPBadGateway()
    
        res.status = falcon.HTTP_CREATED
        res.media = result
class AirlinesResource(BaseResource):

    def on_get(self, req, res, flightnumber):
        session = req.context['session']


        q_airline = session.query(Airline).filter_by(flightnumber=flightnumber).first()
        if q_airline is None:
            raise ResourceNotFound('Airline')

        result = get_one(
            query=q_airline,
            attributes=["flightnumber", "name",
                        "origin", "seatsfirst", "seatsbusiness", "seatseconomy"]
        )
        res.status = falcon.HTTP_200
        res.media = result
