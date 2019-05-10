FROM python:3.6-slim
WORKDIR /entity-service/api
ADD . /entity-service/api
# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt
EXPOSE 8000

CMD [ "gunicorn", "-b", "0.0.0.0:8000", "flightbooking.main:api" ]