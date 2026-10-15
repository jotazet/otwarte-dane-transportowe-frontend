import { apiBaseUrl } from "@/lib/config";
import { SITE_URL } from "@/lib/seo/metadata";

// llms.txt (https://llmstxt.org/): a plain summary of the site for AI tools and agents.

const API = apiBaseUrl();

const BODY = `# Otwarte Dane Transportowe (ODT)

> Open public transport data for Poland: a public catalogue of static and realtime feeds (GTFS, NeTEx, GTFS-RT, SIRI, GBFS) from transport organizations, the record of ODT's requests for data, and a free public API.

The site is in Polish (${SITE_URL}/pl, the default), English (/en), German (/de) and Bulgarian (/bg). The links below point to the Polish pages; swap the locale for another language.

## Data catalogue

- [Feed catalogue](${SITE_URL}/pl/data): every transport organization ODT tracks, with the formats it publishes. Organizations without published data are listed too.
- [Feeds of one organization](${SITE_URL}/pl/data/feeds/1): download URLs, formats, update intervals and licenses; replace 1 with the organization ID from the catalogue.

## Requests for data

- [Cases](${SITE_URL}/pl/cases): the status of ODT's requests for data from each organization, such as a request sent, data received or a refusal.

## API

- Catalogue API (JSON): \`GET ${API}/api/data_manager/feeds/\` lists organizations; \`GET ${API}/api/data_manager/feeds/{organization_id}/\` returns their feeds with download URLs.
- [Developers page](${SITE_URL}/pl/developers): quick start, access and rate limits, and the state of the journey planner.
- [Journey planner API documentation](${API}/api/planner/v1/docs/) and its [OpenAPI schema](${API}/api/planner/v1/schema/): routing, departures, vehicle positions and stop search.

## About

- [About open transport data](${SITE_URL}/pl/info): the formats, the legal basis in Poland and how to work with ODT.
- [Blog](${SITE_URL}/pl/blog): news from the project, in Polish.
`;

export function GET() {
  return new Response(BODY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
