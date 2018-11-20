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
from .common import get_all, create, get_one, update

class PassangersCollectionResource(BaseResource):
    """
    Handle for endpoint: /passangers/
    """
    def on_get(self, req, res):
        session = req.context['session']
        result = get_all(
            name='passangers',
            query=session.query(Passanger),
            attributes=["name", "origin", "phonenumber",
                        "email", "sex", "nationality"]
        )


        res.status = falcon.HTTP_OK
        res.media = result
  # @validate(load_schema('create_passanger'))
    def on_post(self,req,res):
        session = req.context['session']
        data = req.media
        attributes = [
            "name", "origin", "phonenumber", "email", "sex", "nationality"
        ]
        for attr in attributes:
            if data.get(attr) == None:
                raise falcon.HTTPMissingParam(attr)

        email = data.get("email")
        q_passanger = session.query(Passanger).filter_by(email=email).first()
        if q_passanger is not None:
            raise ResourceAlreadyExisted("Passanger")
        
        try:
            result = create(
                session=session,
                resource=Passanger(
                    name=data.get('name'),
                    origin=data.get('origin'),
                    phonenumber=data.get('phonenumber'),
                    email=data.get('email'),
                    dob=data.get('dob'),
                    sex=data.get('sex'),
                    nationality=data.get('nationality')
                ),
                attributes=attributes
            )
        except:
            raise falcon.HTTPBadGateway()
        res.status = falcon.HTTP_CREATED
        res.media = result
        
class PassangersResource(BaseResource):
    """
    Handle for endpoint: /passangers/{passangerid}
    """
    def on_get(self, req, res, passangerid):
        session = req.context['session']
        q_passanger = session.query(Passanger).filter_by(
            passangerid=passangerid).first()
        if q_passanger is None:
            raise ResourceNotFound("Passanger")

        result = get_one(
            query=q_passanger, 
            attributes=["name", "origin", "phonenumber", "email", "sex", "nationality"
        ])
        res.status = falcon.HTTP_200
        res.media = result

    def on_put(self, req, res, passangerid):
        session = req.context['session']
        data = req.media

        q_passanger = session.query(Passanger).filter_by(
            passangerid=passangerid).first()
        if q_passanger is None:
            raise ResourceNotFound("Passanger")

        result = update(
            data=data,
            session=session,
            query=session.query(Passanger),
            attributes=[
                "name", "phonenumber", "nationality"
            ]
        )

        res.status = falcon.HTTP_200
        res.media = result
