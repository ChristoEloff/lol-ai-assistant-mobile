import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-search-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-search-bar.component.html',
  styleUrls: ['./profile-search-bar.component.css']
})
export class ProfileSearchBarComponent {
  // Output event to trigger parent search
  readonly search = output<{ region: string; riotId: string }>();

  // Reactive Signals for search state
  public selectedRegion = signal<string>('EUW1');
  public riotIdQuery = signal<string>('Provita8#EUW');
  public isInvalid = signal<boolean>(false);

  onRegionChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedRegion.set(value);
  }

  onInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.riotIdQuery.set(value);
    // Reset invalid state as user types
    if (this.isInvalid()) {
      this.isInvalid.set(false);
    }
  }

  triggerSearch() {
    const query = this.riotIdQuery().trim();
    if (query && query.includes('#')) {
      this.isInvalid.set(false);
      this.search.emit({
        region: this.selectedRegion(),
        riotId: query
      });
    } else {
      this.isInvalid.set(true);
    }
  }
}
