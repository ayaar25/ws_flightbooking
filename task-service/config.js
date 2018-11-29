exports.config = {
    "baseUrl": process.env.BASE_URL || "http://localhost:8080/engine-rest",
    "baseEntityUrl": process.env.BASE_ENTITY_URL || "http://localhost:8000",
    "entityUrls": {
        "passangers": "/passangers",
        "airlines": "/airlines",
        "bookings": "/bookings",
        "schedules": "/schedules",
        "transactions": "/transactions"
    }
}