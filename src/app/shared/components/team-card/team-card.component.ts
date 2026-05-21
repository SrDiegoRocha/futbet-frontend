import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ITeamResponse } from '@core/interfaces/team.interface';
import { TeamBadgeComponent } from '@shared/components/team-badge/team-badge.component';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [TeamBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-card.component.html',
  styleUrl: './team-card.component.scss',
})
export class TeamCardComponent {
  public readonly team = input.required<ITeamResponse>();
}
