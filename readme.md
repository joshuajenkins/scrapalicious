This is a little node server that scrapes (eventually) various less-than-ideal data sources, lightly cleans up the data, and returns a CSV in plaintext.

At the moment it supports returning daily reservoir storage data for the 12 California reservoirs that the CDEC provides data for.

You can think of this as a little proxy server to make it easier to ingest data into [Numeracy](https://numeracy.co)