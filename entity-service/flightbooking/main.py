import falcon
from falcon_cors import CORS
from flightbooking import log
from flightbooking.database import db_session, init_session, DatabaseSessionManager

from flightbooking.resources import airline, passanger, booking, schedule, transaction
from flightbooking.exceptions import AppError

LOG = log.get_logger()

class App(falcon.API):
    def __init__(self, *args, **kwargs):
        super(App, self).__init__(*args, **kwargs)
        LOG.info('Server is starting')

        # self.add_route('/', base.BaseResource())
        self.add_route('/passangers', passanger.PassangersCollectionResource())
        self.add_route('/passangers/{passangerid}', passanger.PassangersResource())

        self.add_route('/airlines', airline.AirlinesCollectionResource())
        self.add_route('/airlines/{flightnumber}', airline.AirlinesResource())

        self.add_route('/schedules', schedule.SchedulesCollectionResource())
        self.add_route('/schedules/{scheduleid}', schedule.SchedulesResource())

        self.add_route('/bookings', booking.BookingsCollectionResource())
        self.add_route('/bookings/{bookingid}', booking.BookingsResource())

        self.add_route('/transactions', transaction.TransactionsCollectionResource())
        self.add_route('/transactions/{transactionid}', transaction.TransactionsResource())

        # Add route here
        self.add_error_handler(AppError, AppError.handle)

init_session()
cors = CORS(allow_origins_list=['http://localhost:8000'], allow_all_headers=True, allow_all_methods=True)
middleware = [DatabaseSessionManager(db_session), cors.middleware]
api = App(middleware=middleware)
