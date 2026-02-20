import logging
import pandas as pd
from sqlalchemy import create_engine

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

EXPECTED_COLUMNS = {
    "id": "int64",
    "name": "object",
    "value": "float64",
    "date": "object",
}


class DataPipelineError(Exception):
    """Base exception for pipeline failures."""


class SchemaValidationError(DataPipelineError):
    """Raised when a DataFrame does not match the expected schema."""


class DataPipeline:
    """End-to-end data pipeline: read, validate, transform, clean, write."""

    def __init__(self, expected_schema: dict[str, str] | None = None):
        self.expected_schema = expected_schema or EXPECTED_COLUMNS

    # ------------------------------------------------------------------ #
    #  1. Read
    # ------------------------------------------------------------------ #
    def read_csv(self, path: str) -> pd.DataFrame:
        """Read a CSV file into a DataFrame.

        Raises DataPipelineError on any I/O or parsing failure.
        """
        logger.info("Reading CSV from %s", path)
        try:
            df = pd.read_csv(path)
        except FileNotFoundError:
            logger.error("File not found: %s", path)
            raise DataPipelineError(f"File not found: {path}")
        except pd.errors.ParserError as exc:
            logger.error("Failed to parse CSV %s: %s", path, exc)
            raise DataPipelineError(f"CSV parse error for {path}: {exc}") from exc
        except Exception as exc:
            logger.error("Unexpected error reading %s: %s", path, exc)
            raise DataPipelineError(f"Could not read {path}: {exc}") from exc

        logger.info("Loaded %d rows, %d columns from %s", len(df), len(df.columns), path)
        return df

    # ------------------------------------------------------------------ #
    #  2. Validate
    # ------------------------------------------------------------------ #
    def validate_schema(self, df: pd.DataFrame) -> pd.DataFrame:
        """Verify that *df* contains the expected columns and compatible types.

        Raises SchemaValidationError on mismatch.
        """
        logger.info("Validating schema against %d expected columns", len(self.expected_schema))

        missing = set(self.expected_schema) - set(df.columns)
        if missing:
            logger.error("Missing columns: %s", missing)
            raise SchemaValidationError(f"Missing columns: {missing}")

        extra = set(df.columns) - set(self.expected_schema)
        if extra:
            logger.warning("Extra columns will be kept: %s", extra)

        type_mismatches = []
        for col, expected_dtype in self.expected_schema.items():
            actual = str(df[col].dtype)
            if actual != expected_dtype:
                type_mismatches.append(f"{col}: expected {expected_dtype}, got {actual}")

        if type_mismatches:
            logger.error("Type mismatches: %s", type_mismatches)
            raise SchemaValidationError(f"Type mismatches: {'; '.join(type_mismatches)}")

        logger.info("Schema validation passed")
        return df

    # ------------------------------------------------------------------ #
    #  3. Transform
    # ------------------------------------------------------------------ #
    def transform_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply business-rule transformations.

        - Strip whitespace from string columns.
        - Parse the *date* column to datetime (if present).
        - Normalise *name* to title-case (if present).

        Raises DataPipelineError on transformation failure.
        """
        logger.info("Transforming data (%d rows)", len(df))
        try:
            for col in df.select_dtypes(include="object").columns:
                df[col] = df[col].astype(str).str.strip()

            if "date" in df.columns:
                df["date"] = pd.to_datetime(df["date"], errors="coerce")
                bad_dates = df["date"].isna().sum()
                if bad_dates:
                    logger.warning("%d unparseable dates coerced to NaT", bad_dates)

            if "name" in df.columns:
                df["name"] = df["name"].str.title()

        except Exception as exc:
            logger.error("Transformation failed: %s", exc)
            raise DataPipelineError(f"Transformation failed: {exc}") from exc

        logger.info("Transformation complete")
        return df

    # ------------------------------------------------------------------ #
    #  4. Clean nulls
    # ------------------------------------------------------------------ #
    def clean_nulls(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle null values.

        Strategy:
        - Numeric columns → fill with column median.
        - String / object columns → fill with empty string.
        - Drop rows that are *entirely* null.

        Raises DataPipelineError on failure.
        """
        logger.info("Cleaning nulls (%d total before cleaning)", int(df.isna().sum().sum()))
        try:
            rows_before = len(df)
            df = df.dropna(how="all")
            dropped = rows_before - len(df)
            if dropped:
                logger.info("Dropped %d entirely-null rows", dropped)

            for col in df.select_dtypes(include="number").columns:
                if df[col].isna().any():
                    median = df[col].median()
                    df[col] = df[col].fillna(median)
                    logger.info("Filled nulls in '%s' with median %.4f", col, median)

            for col in df.select_dtypes(include="object").columns:
                if df[col].isna().any():
                    df[col] = df[col].fillna("")
                    logger.info("Filled nulls in '%s' with empty string", col)

        except Exception as exc:
            logger.error("Null cleaning failed: %s", exc)
            raise DataPipelineError(f"Null cleaning failed: {exc}") from exc

        logger.info("Null cleaning complete (%d nulls remaining)", int(df.isna().sum().sum()))
        return df

    # ------------------------------------------------------------------ #
    #  5. Write
    # ------------------------------------------------------------------ #
    def write_to_database(
        self, df: pd.DataFrame, connection_string: str, table: str = "pipeline_output"
    ) -> int:
        """Write *df* to a SQL database table, replacing existing rows.

        Returns the number of rows written.
        Raises DataPipelineError on connection or write failure.
        """
        logger.info("Writing %d rows to table '%s'", len(df), table)
        try:
            engine = create_engine(connection_string)
            with engine.connect() as conn:
                rows = df.to_sql(table, con=conn, if_exists="replace", index=False)
        except Exception as exc:
            logger.error("Database write failed: %s", exc)
            raise DataPipelineError(f"Database write failed: {exc}") from exc

        written = rows if rows is not None else len(df)
        logger.info("Successfully wrote %d rows to '%s'", written, table)
        return written

    # ------------------------------------------------------------------ #
    #  Full run
    # ------------------------------------------------------------------ #
    def run(self, csv_path: str, connection_string: str, table: str = "pipeline_output") -> int:
        """Execute the full pipeline: read → validate → transform → clean → write."""
        logger.info("=== Pipeline started ===")
        df = self.read_csv(csv_path)
        df = self.validate_schema(df)
        df = self.transform_data(df)
        df = self.clean_nulls(df)
        rows = self.write_to_database(df, connection_string, table)
        logger.info("=== Pipeline finished — %d rows written ===", rows)
        return rows
