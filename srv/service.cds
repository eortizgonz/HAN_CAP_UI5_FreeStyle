using { my.project as my } from '../db/schema';

service CatalogService {
  entity Tareas as projection on my.Tareas;
}