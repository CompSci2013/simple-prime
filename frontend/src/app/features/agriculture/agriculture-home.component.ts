import { Component } from '@angular/core';

/**
 * Agriculture Home Component - Agricultural Domain Landing Page (NgModule Pattern)
 *
 * Feature component serving as the primary entry point for the Agriculture domain module.
 * This component provides navigation and context for agricultural data exploration,
 * including crop analysis, soil data, and yield trends.
 *
 * Architecture Note:
 * This component uses the traditional NgModule pattern (Angular 13 style) and is
 * declared in AgricultureModule. Unlike the Automobile components which use
 * standalone: true, this component relies on its parent module for dependency
 * injection and imports.
 *
 * @class AgricultureHomeComponent
 * @since 1.0 (Original Angular 13 implementation)
 */
@Component({
  selector: 'app-agriculture-home',
  templateUrl: './agriculture-home.component.html',
  styleUrls: ['./agriculture-home.component.scss']
})
export class AgricultureHomeComponent {
  // NgModule-based component - no standalone imports needed
  // Dependencies come from AgricultureModule imports
}
