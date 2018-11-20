import json
import falcon
from flightbooking.exceptions import AppError

try:
    from collections import OrderedDict
except ImportError:
    OrderedDict = dict

RESOURCE_OK = {
    'status': falcon.HTTP_200,
    'code': 0,
    'title': 'OK'
}

RESOURCE_CREATED = {
    'status': falcon.HTTP_201,
    'code': 0,
    'title': 'OK'
}

RESOURCE_DELETED = {
    'status': falcon.HTTP_200,
    'code': 0,
    'title': 'Resource deleted'
}

# ===== RESOURCE NOT FOUND ERROR
ERR_RESOURCE_NOT_FOUND = {
    'status': falcon.HTTP_404,
    'code': 404
}

ERR_TRANSACTION_RESOURCE_NOT_FOUND = {
    'status': falcon.HTTP_404,
    'code': 403,
    'title': 'Transaction not found'
}

# ===== RESOURCE ALREADY EXIST ERROR

ERR_RESOURCE_ALREADY_EXISTED = {
    'status': falcon.HTTP_409,
    'code': 409
}

class NoError(AppError):
    def __init__(self, description=None):
        super(NoError, self).__init__(RESOURCE_OK)
        self.error['description'] = description

class ResourceCreated(AppError):
    def __init__(self, description=None):
        super(ResourceCreated, self).__init__(RESOURCE_CREATED)
        self.error['description'] = description
        
class ResourceDeleted(AppError):
    def __init__(self, description=None):
        super(ResourceDeleted, self).__init__(RESOURCE_DELETED)
        self.error['description'] = description

# ===== RESOURCE NOT FOUND ERROR HANDLER

class ResourceNotFound(AppError):
    def __init__(self, name, description=None):
        super(ResourceNotFound, self).__init__(
            ERR_RESOURCE_NOT_FOUND)
        self.error['title'] = (name + " not found")
        self.error['description'] = description

class TransactionResourceNotFound(AppError):
    def __init__(self, description=None):
        super(TransactionResourceNotFound, self).__init__(ERR_TRANSACTION_RESOURCE_NOT_FOUND)
        self.error['title'] += (": " + description if description else "")
        self.error['description'] = description

# ===== RESOURCE ALREADY EXISTED ERROR HANDLER

<<<<<<< HEAD
class BookingResourceAlreadyExisted(AppError):
    def __init__(self, description=None):
        super(BookingResourceAlreadyExisted, self).__init__(ERR_BOOKING_RESOURCE_ALREADY_EXISTED)
        self.error['title'] += (": " + description if description else "")
        self.error['description'] = description

class AirlineResourceAlreadyExisted(AppError):
    def __init__(self, description=None):
        super(AirlineResourceAlreadyExisted, self).__init__(ERR_AIRLINE_RESOURCE_ALREADY_EXISTED)
        self.error['title'] += (": " + description if description else "")
        self.error['description'] = description

class ScheduleResourceAlreadyExisted(AppError):
    def __init__(self, description=None):
        super(ScheduleResourceAlreadyExisted, self).__init__(ERR_SCHEDULE_RESOURCE_ALREADY_EXISTED)
        self.error['title'] += (": " + description if description else "")
        self.error['description'] = description

class PassangerResourceAlreadyExisted(AppError):
    def __init__(self, description=None):
        super(PassangerResourceAlreadyExisted, self).__init__(ERR_PASSANGER_RESOURCE_ALREADY_EXISTED)
        self.error['title'] += (": " + description if description else "")
        self.error['description'] = description

class TransactionResourceAlreadyExisted(AppError):
    def __init__(self, description=None):
        super(TransactionResourceAlreadyExisted, self).__init__(ERR_TRANSACTION_RESOURCE_ALREADY_EXISTED)
        self.error['title'] += (": " + description if description else "")
        self.error['description'] = description
=======
class ResourceAlreadyExisted(AppError):
    def __init__(self, name, description=None):
        super(ResourceAlreadyExisted, self).__init__(
            ERR_RESOURCE_ALREADY_EXISTED)
        self.error['title'] = (name + " already existed")
        self.error['description'] = description
>>>>>>> entity-service
