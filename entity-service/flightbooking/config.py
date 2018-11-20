import os

APP_ENV = os.environ.get('APP_ENV') or 'staging' # ONLY TEMPORARY MEASURE, DON'T FORGET TO CHANGE AGAIN
DB_HOST = os.environ.get('DB_HOST') or '127.0.0.1'
DB_USER = os.environ.get('DB_USER') or 'root'
DB_PASS = os.environ.get('DB_PASS') or '1234567890'
DB_NAME = os.environ.get('DB_NAME') or 'flightbooking'
DB_ECHO = os.environ.get('DB_ECHO') or False

if APP_ENV == 'staging' or APP_ENV == 'prod':
    DB_CONFIG = (DB_USER, DB_PASS, DB_HOST, DB_NAME)
    DATABASE_URL = "mysql+mysqlconnector://%s:%s@%s/%s" % DB_CONFIG
    LOG_LEVEL = 'INFO'
else:
    DB_CONFIG = (DB_HOST, DB_NAME)
    DATABASE_URL = "mysql+mysqlconnector://%s/%s" % DB_CONFIG
    LOG_LEVEL = 'DEBUG'

DB_AUTOCOMMIT = True