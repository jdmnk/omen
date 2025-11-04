import { GAMMA_API_HOST } from "@/lib/api";

export type SearchEvent = {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  liquidity?: number;
  volume?: number;
  volume24hr?: number;
  markets?: SearchMarket[];
};

export type SearchMarket = {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  category?: string;
  liquidity?: string;
  volume?: string;
  outcomePrices?: string;
  outcomes?: string;
  active: boolean;
  closed: boolean;
  icon?: string;
  image?: string;
};

export type SearchTag = {
  id: string;
  label: string;
  slug: string;
  event_count: number;
};

export type SearchProfile = {
  id: string;
  name: string;
  user: number;
  profileImage?: string;
  bio?: string;
  pseudonym?: string;
};

export type SearchResponse = {
  events: SearchEvent[] | null;
  tags: SearchTag[] | null;
  profiles: SearchProfile[] | null;
  pagination: {
    hasMore: boolean;
    totalResults: number;
  };
};

export type SearchParams = {
  q: string;
  cache?: boolean;
  events_status?: string;
  limit_per_type?: number;
  page?: number;
  events_tag?: string[];
  keep_closed_markets?: number;
  sort?: string;
  ascending?: boolean;
  search_tags?: boolean;
  search_profiles?: boolean;
  recurrence?: string;
  exclude_tag_id?: number[];
  optimized?: boolean;
};

export async function fetchMarketSearch(
  params: SearchParams
): Promise<SearchResponse> {
  const url = new URL(`${GAMMA_API_HOST}/public-search`);

  // Add required query parameter
  url.searchParams.set("q", params.q);

  // Add optional parameters
  if (params.cache !== undefined) {
    url.searchParams.set("cache", params.cache.toString());
  }
  if (params.events_status) {
    url.searchParams.set("events_status", params.events_status);
  }
  if (params.limit_per_type !== undefined) {
    url.searchParams.set("limit_per_type", params.limit_per_type.toString());
  }
  if (params.page !== undefined) {
    url.searchParams.set("page", params.page.toString());
  }
  if (params.events_tag && params.events_tag.length > 0) {
    params.events_tag.forEach((tag) => {
      url.searchParams.append("events_tag[]", tag);
    });
  }
  if (params.keep_closed_markets !== undefined) {
    url.searchParams.set(
      "keep_closed_markets",
      params.keep_closed_markets.toString()
    );
  }
  if (params.sort) {
    url.searchParams.set("sort", params.sort);
  }
  if (params.ascending !== undefined) {
    url.searchParams.set("ascending", params.ascending.toString());
  }
  if (params.search_tags !== undefined) {
    url.searchParams.set("search_tags", params.search_tags.toString());
  }
  if (params.search_profiles !== undefined) {
    url.searchParams.set("search_profiles", params.search_profiles.toString());
  }
  if (params.recurrence) {
    url.searchParams.set("recurrence", params.recurrence);
  }
  if (params.exclude_tag_id && params.exclude_tag_id.length > 0) {
    params.exclude_tag_id.forEach((id) => {
      url.searchParams.append("exclude_tag_id[]", id.toString());
    });
  }
  if (params.optimized !== undefined) {
    url.searchParams.set("optimized", params.optimized.toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch search results: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
