const CONSTANTS = {
  FIELD: {
      WIDTH: 800,
      HEIGHT: 600,
      GOAL_SIZE: 140,
      WALL_THICKNESS: 10,
      CENTER_CIRCLE_RADIUS: 50
  },
  PLAYER: {
      RADIUS: 20,
      SPEED: 8,
      MAX_SPEED: 12,
      ACCELERATION: 0.8,
      DECELERATION: 0.85,
      KICK_POWER: 15,
      MASS: 5,
      BOUNCE_FACTOR: 0.5,
      SPRINT_MULTIPLIER: 1.3,
      KICK_COOLDOWN: 150,
      NAME_OFFSET: 30
  },
  BALL: {
      RADIUS: 10,
      SPEED_DECAY: 0.995,
      MAX_SPEED: 20,
      MASS: 1,
      RESTITUTION: 1.1,
      WALL_BOUNCE: 0.95,
      MIN_SPEED: 0.5,
      FRICTION: 0.995,
      KICK_RESPONSE: 1.2,
      PLAYER_BOUNCE: 1.1
  },
  COLORS: {
      FIELD: '#2E1A47',        // Morado oscuro para el campo
      WALLS: '#9D4EDD',        // Morado neón para las líneas
      PLAYER1: '#FF3366',      // Rosa neón para equipo 1
      PLAYER2: '#00FFCC',      // Turquesa neón para equipo 2
      BALL: '#FFFFFF',         // Blanco para la pelota
      GOAL_INDICATOR: '#FF00FF',
      COUNTDOWN: '#FFFFFF',
      SCORE_TEXT: '#FFFFFF',
      TIMER_TEXT: '#FFFFFF',
      NAME_BACKGROUND: 'rgba(46, 26, 71, 0.85)',
      NAME_TEXT: '#FFFFFF',
      TEAM_INDICATOR: {
          LEFT: '#FF3366',
          RIGHT: '#00FFCC'
      },
      UI: {
          PRIMARY: '#9D4EDD',    // Morado neón
          SECONDARY: '#FF00FF',  // Magenta neón
          ACCENT: '#7B2CBF',     // Morado medio
          BACKGROUND: '#1A0B2E', // Morado muy oscuro
          GRADIENT: {
              START: '#2E1A47',
              END: '#1A0B2E'
          }
      }
  },
  GAME: {
      DURATION: 120,           // Duración del partido en segundos
      FPS: 60,                // Frames por segundo objetivo
      COUNTDOWN_DURATION: 3,   // Duración de la cuenta regresiva
      GOAL_CELEBRATION_DURATION: 2000,
      MIN_PLAYERS: 2,
      SCORE_LIMIT: 5,
      PERIODS: {
          FIRST_HALF: '1T',
          SECOND_HALF: '2T'
      }
  },
  PHYSICS: {
      GRAVITY: 0,
      AIR_RESISTANCE: 0.99,
      CORNER_BOUNCE: 1.1,
      MIN_BOUNCE_SPEED: 0.1,
      COLLISION_DAMPENING: 0.8,
      WALL_FRICTION: 0.7,
      PLAYER_COLLISION_FORCE: 1.2
  },
  UI: {
      FONT_FAMILY: 'Exo, sans-serif',
      NAME_FONT_SIZE: 14,
      SCORE_FONT_SIZE: 24,
      TIMER_FONT_SIZE: 24,
      COUNTDOWN_FONT_SIZE: 72,
      MESSAGE_FONT_SIZE: 36,
      HUD_PADDING: 20,
      JOYSTICK: {
          SIZE: 120,
          INNER_SIZE: 60,
          DEAD_ZONE: 0.1,
          MAX_RANGE: 40,
          OPACITY: 0.3,
          POSITION: {
              BOTTOM: 20,
              LEFT: 20
          }
      }
  },
  NETWORK: {
      UPDATE_RATE: 16,        // ms (aprox. 60 FPS)
      INTERPOLATION_DELAY: 100,// ms
      SNAPSHOT_HISTORY: 10,
      PREDICTION_THRESHOLD: 150,// ms
      RECONCILIATION_THRESHOLD: 10,
      MAX_LATENCY: 1000       // ms
  },
  EFFECTS: {
      GOAL_FLASH_DURATION: 500,
      GOAL_FLASH_COLOR: 'rgba(255, 255, 255, 0.3)',
      KICK_EFFECT_DURATION: 200,
      KICK_EFFECT_RADIUS: 30,
      TRAIL_LENGTH: 5,
      TRAIL_OPACITY: 0.3,
      SHADOW_BLUR: 5,
      SHADOW_COLOR: 'rgba(0, 0, 0, 0.3)',
      BALL_GRADIENT: {
          INNER: 'rgba(255, 255, 255, 0.8)',
          OUTER: 'rgba(255, 255, 255, 0)'
      }
  },
  SOUND: {
      VOLUME: {
          MASTER: 1.0,
          EFFECTS: 0.7,
          MUSIC: 0.5,
          WHISTLE: 0.6,
          KICK: 0.4,
          GOAL: 0.8
      },
      ENABLED: true
  },
  DEBUG: {
      SHOW_COLLISION_BOXES: false,
      SHOW_VELOCITIES: false,
      SHOW_FPS: false,
      SHOW_PING: false,
      LOG_LEVEL: 'error' // 'debug' | 'info' | 'warn' | 'error'
  },
  MOBILE: {
      TOUCH_SENSITIVITY: 1.2,
      MIN_SCREEN_WIDTH: 320,
      ORIENTATION_LOCK: 'landscape',
      VIBRATION_DURATION: 50,
      TOUCH_CONTROLS: {
          OPACITY: 0.5,
          SCALE_FACTOR: 0.8
      }
  }
};

// Hacer las constantes disponibles tanto para Node.js como para el navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
} else if (typeof window !== 'undefined') {
  window.CONSTANTS = CONSTANTS;
}
