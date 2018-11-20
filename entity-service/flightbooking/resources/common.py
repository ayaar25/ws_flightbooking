import falcon
import time, datetime

def date_to_string(dt):
    if isinstance(dt, datetime.datetime):
        return "{}-{}-{}T{}:{}:{}".format(dt.day, dt.month, dt.year, dt.hour, dt.minute, dt.second)

def get_all(name, query, attributes):
    items = []

    for item in query:
        data = {}
        for k in attributes:
            try:
                if (k == "departuretime"):
                    data[k] = date_to_string(item.__dict__[k])
                else:
                    data[k] = item.__dict__[k]
            except:
                raise falcon.HTTPBadGateway()
        items.append(data)

    result = {
        "meta": {
            "code": 200,
            "message": 'OK',
        },
        "data": {
            "total": len(items),
            name: items,
        },
    }

    return result


def get_one(query, attributes):
    data = {}
    for k in attributes:
        try:
            if (k == "departuretime"):
                data[k] = date_to_string(query.__dict__[k])
            else :
                data[k] = query.__dict__[k]
        except:
            raise falcon.HTTPBadGateway()

    result = {
        "meta": {
            "code": 200,
            "message": 'OK',
        },
        "data": data
    }

    return result

def create(session, resource, attributes):
    try:
        session.add(resource)
        data = {}
        for k in attributes:
            data[k] = resource.__dict__[k]

        result = {
            "meta": {
                "code": 201,
                "message": 'OK'
            },
            "data": data,
        }

        return result
    except Exception as e:
        raise falcon.HTTPBadGateway()
    session.commit()

def update(data, session, query, attributes):
    updated_data = {}
    for k, v in data.items():
        if k not in attributes:
            raise falcon.HTTPInvalidParam(k, "Invalid param")
        updated_data[k] = v

    try:
        query.update(
            updated_data
        )
    except:
        import traceback
        traceback.print_exc()
        raise falcon.HTTPBadGateway()
    session.commit()

    result = {
        "meta": {
            "code": 200,
            "message": 'OK',
        },
        "data": updated_data,
    }
    return result
