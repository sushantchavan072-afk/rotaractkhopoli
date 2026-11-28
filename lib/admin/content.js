import { cleanEvents, cleanTeam, cleanGallery, cleanSite, cleanReviews } from './validate.js';

/** The content the admin page edits: one JSON file per part, each with its checker and a name for save messages. */
export const FILES = {
  events: 'data/content/events.json',
  team: 'data/content/team.json',
  gallery: 'data/content/gallery.json',
  site: 'data/content/site.json',
  reviews: 'data/content/reviews.json',
};
export const CLEAN = { events: cleanEvents, team: cleanTeam, gallery: cleanGallery, site: cleanSite, reviews: cleanReviews };
export const LABEL = { events: 'events', team: 'team', gallery: 'gallery', site: 'club details', reviews: 'reviews' };
export const toFile = (data) => Buffer.from(`${JSON.stringify(data, null, 2)}\n`);
