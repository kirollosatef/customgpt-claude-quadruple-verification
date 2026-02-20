import json
from sqlalchemy import create_engine, MetaData, Table, select


def search_products(search_term: str, db_config: dict) -> str:
    """Search for products matching the given term and return results as JSON.

    Args:
        search_term: The product name/keyword to search for.
        db_config: Dict with keys: host, user, password, database.

    Returns:
        JSON string of matching products.
    """
    url = "mysql+mysqlconnector://{user}:{password}@{host}/{database}".format(**db_config)
    engine = create_engine(url)
    metadata = MetaData()
    products = Table("products", metadata, autoload_with=engine)

    stmt = select(products).where(products.c.name.contains(search_term))

    with engine.connect() as conn:
        rows = conn.execute(stmt)
        results = [dict(row._mapping) for row in rows]

    return json.dumps(results, default=str)


if __name__ == "__main__":
    db_config = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "mydb",
    }

    term = input("Enter search term: ")
    print(search_products(term, db_config))
