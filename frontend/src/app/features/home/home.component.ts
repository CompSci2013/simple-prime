import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Home Component - Landing Page
 *
 * Serves as the main entry point and domain selector for the Generic-Prime application.
 * This component provides navigation to various domain-specific modules including
 * Automobile and Agriculture.
 *
 * The home page acts as a hub allowing users to select their desired domain of interest
 * and navigate to the corresponding feature modules for data exploration and visualization.
 *
 * @class HomeComponent
 * @since 1.0
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class HomeComponent {
}
