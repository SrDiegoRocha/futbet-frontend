import {
  animate,
  animateChild,
  group,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';

const EASE_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)';
const EASE_DECEL = 'cubic-bezier(0, 0, 0.2, 1)';

/**
 * Fade cruzado entre rotas irmãs. Aplicar no container do `<router-outlet>` com
 * `[@routeFade]="getRouteAnimationData()"` para disparar a cada troca.
 */
export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
        }),
      ],
      { optional: true },
    ),
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(
        ':leave',
        [animate(`160ms ${EASE_OUT}`, style({ opacity: 0 }))],
        { optional: true },
      ),
      query(
        ':enter',
        [animate(`200ms ${EASE_OUT}`, style({ opacity: 1 }))],
        { optional: true },
      ),
    ]),
    query(':enter', animateChild(), { optional: true }),
  ]),
]);

/**
 * Stagger pra listas. Aplica-se no container com `[@listStagger]="items().length"`.
 * Cada filho que entra ganha fade + slide up, com 40ms entre eles.
 */
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        stagger('40ms', [
          animate(
            `260ms ${EASE_OUT}`,
            style({ opacity: 1, transform: 'translateY(0)' }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Modal/dialog enter (scale + fade). Aplica-se no elemento renderizado por @if.
 */
export const modalScale = trigger('modalScale', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.96) translateY(8px)' }),
    animate(
      `200ms ${EASE_DECEL}`,
      style({ opacity: 1, transform: 'scale(1) translateY(0)' }),
    ),
  ]),
  transition(':leave', [
    animate(
      `150ms ${EASE_OUT}`,
      style({ opacity: 0, transform: 'scale(0.96) translateY(4px)' }),
    ),
  ]),
]);

/**
 * Backdrop overlay enter/leave fade.
 */
export const backdropFade = trigger('backdropFade', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`160ms ${EASE_OUT}`, style({ opacity: 1 })),
  ]),
  transition(':leave', [animate(`120ms ${EASE_OUT}`, style({ opacity: 0 }))]),
]);

/**
 * Toast/snackbar slide in/out. Mobile: bottom. Desktop: right.
 */
export const toastSlide = trigger('toastSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate(
      `220ms ${EASE_DECEL}`,
      style({ opacity: 1, transform: 'translateY(0)' }),
    ),
  ]),
  transition(':leave', [
    animate(
      `160ms ${EASE_OUT}`,
      style({ opacity: 0, transform: 'translateY(8px) scale(0.97)' }),
    ),
  ]),
]);

/**
 * Bottom sheet slide up (mobile).
 */
export const sheetSlideUp = trigger('sheetSlideUp', [
  transition(':enter', [
    style({ transform: 'translateY(100%)' }),
    animate(`250ms ${EASE_DECEL}`, style({ transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`200ms ${EASE_OUT}`, style({ transform: 'translateY(100%)' })),
  ]),
]);
