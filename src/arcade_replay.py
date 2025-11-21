import os
import arcade
import numpy as np

from src.f1_data import DT


SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080


def build_track_from_example_lap(example_lap, track_width=500):
    plot_x_ref = example_lap["X"].to_numpy()
    plot_y_ref = example_lap["Y"].to_numpy()

    # compute tangents
    dx = np.gradient(plot_x_ref)
    dy = np.gradient(plot_y_ref)

    norm = np.sqrt(dx**2 + dy**2)
    norm[norm == 0] = 1.0
    dx /= norm
    dy /= norm

    nx = -dy
    ny = dx

    x_outer = plot_x_ref + nx * (track_width / 2)
    y_outer = plot_y_ref + ny * (track_width / 2)
    x_inner = plot_x_ref - nx * (track_width / 2)
    y_inner = plot_y_ref - ny * (track_width / 2)

    # world bounds
    x_min = min(plot_x_ref.min(), x_inner.min(), x_outer.min())
    x_max = max(plot_x_ref.max(), x_inner.max(), x_outer.max())
    y_min = min(plot_y_ref.min(), y_inner.min(), y_outer.min())
    y_max = max(plot_y_ref.max(), y_inner.max(), y_outer.max())

    return (plot_x_ref, plot_y_ref, x_inner, y_inner, x_outer, y_outer,
            x_min, x_max, y_min, y_max)


class F1ReplayWindow(arcade.Window):
    def __init__(self, frames, example_lap, drivers, title,
                 playback_speed=1.0, driver_colors=None):
        super().__init__(SCREEN_WIDTH, SCREEN_HEIGHT, title, resizable=False)

        self.frames = frames
        self.n_frames = len(frames)
        self.drivers = list(drivers)
        self.playback_speed = playback_speed
        self.driver_colors = driver_colors or {}
        self.frame_index = 0
        self.paused = False

        # Build track geometry
        (self.plot_x_ref, self.plot_y_ref,
         self.x_inner, self.y_inner,
         self.x_outer, self.y_outer,
         self.x_min, self.x_max,
         self.y_min, self.y_max) = build_track_from_example_lap(example_lap)

        padding = 0.05
        world_w = max(1.0, self.x_max - self.x_min)
        world_h = max(1.0, self.y_max - self.y_min)
        usable_w = SCREEN_WIDTH * (1 - 2 * padding)
        usable_h = SCREEN_HEIGHT * (1 - 2 * padding)

        self.world_scale = min(usable_w / world_w, usable_h / world_h)
        world_cx = (self.x_min + self.x_max) / 2
        world_cy = (self.y_min + self.y_max) / 2
        screen_cx = SCREEN_WIDTH / 2
        screen_cy = SCREEN_HEIGHT / 2
        self.tx = screen_cx - self.world_scale * world_cx
        self.ty = screen_cy - self.world_scale * world_cy

        # Precompute track points in screen coords (densified for smoothness)
        self.track_outer_points = self._build_polyline(self.x_outer, self.y_outer)
        self.track_inner_points = self._build_polyline(self.x_inner, self.y_inner)

        # Background texture if exists
        bg_path = os.path.join("resources", "background.png")
        self.bg_texture = arcade.load_texture(bg_path) if os.path.exists(bg_path) else None

        self.time_label = arcade.Text(
            "t = 0.0 s",     # text
            20,              # x
            20,              # y
            arcade.color.WHITE, 
            18,              # font size
            anchor_x="left",
            anchor_y="bottom",
        )

        arcade.set_background_color(arcade.color.BLACK)

    def _build_polyline(self, xs, ys, interp_points=2000):
        t_old = np.linspace(0, 1, len(xs))
        t_new = np.linspace(0, 1, interp_points)

        xs_i = np.interp(t_new, t_old, xs)
        ys_i = np.interp(t_new, t_old, ys)

        points = [self.world_to_screen(x, y) for x, y in zip(xs_i, ys_i)]
        return points

    def world_to_screen(self, x, y):
        sx = self.world_scale * x + self.tx
        sy = self.world_scale * y + self.ty
        return sx, sy

    def on_draw(self):
        self.clear()

        # Background image (full-screen) or solid colour
        if self.bg_texture is not None:
            arcade.draw_lrbt_rectangle_textured(
              left=0,
              right=SCREEN_WIDTH,
              bottom=0,
              top=SCREEN_HEIGHT,
              texture=self.bg_texture,
            )

        # Draw track
        track_color = (150, 150, 150)
        arcade.draw_line_strip(self.track_inner_points, track_color, 4)
        arcade.draw_line_strip(self.track_outer_points, track_color, 4)

        # Current frame
        frame = self.frames[self.frame_index]

        # Lap Number display
        # Find leader by lap, then dist
        leader_code = max(
            frame["drivers"],
            key=lambda c: (frame["drivers"][c].get("lap", 1), frame["drivers"][c].get("dist", 0))
        )
        leader_lap = frame["drivers"][leader_code].get("lap", 1)
        lap_text = arcade.Text(
            f"Lap: {leader_lap}",
            30, SCREEN_HEIGHT - 40,
            arcade.color.WHITE, 28,
            anchor_x="left", anchor_y="top"
        )
        lap_text.draw()

        # Total Race Time (below lap counter)
        t = frame["t"]
        hours = int(t // 3600)
        minutes = int((t % 3600) // 60)
        seconds = int(t % 60)
        time_str = f"{hours:02}:{minutes:02}:{seconds:02}"
        time_text = arcade.Text(
            f"Race Time: {time_str}",
            30, SCREEN_HEIGHT - 80,
            arcade.color.WHITE, 22,
            anchor_x="left", anchor_y="top"
        )
        time_text.draw()

        # Draw cars as circles (skip if rel_dist == 1)
        for code, pos in frame["drivers"].items():
            if pos.get("rel_dist", 0) == 1:
                continue  # Don't draw car if rel_dist == 1
            sx, sy = self.world_to_screen(pos["x"], pos["y"])
            color = self.driver_colors.get(code, arcade.color.WHITE)
            arcade.draw_circle_filled(sx, sy, 6, color)

        # Leaderboard
        driver_list = []
        for code, pos in frame["drivers"].items():
            color = self.driver_colors.get(code, arcade.color.WHITE)
            driver_list.append((code, color, pos))
        
        driver_list.sort(key=lambda x: x[2].get("position", 999))

        leaderboard_x = SCREEN_WIDTH - 350
        leaderboard_y = SCREEN_HEIGHT - 80
        row_height = 32

        arcade.Text(
            "Leaderboard",
            leaderboard_x + 10, leaderboard_y + 10,
            arcade.color.WHITE, 22, bold=True
        ).draw()

        # Sort the drivers by dist for leaderboard display
        driver_list.sort(key=lambda x: x[2].get("dist", 999), reverse=True)

        for i, (code, _, pos) in enumerate(driver_list):
            color = self.driver_colors.get(code, arcade.color.WHITE)
            current_pos = i + 1
            if pos.get("rel_dist", 0) == 1:
                text = f"{current_pos}. {code}   OUT"
            else:
                text = f"{current_pos}. {code}"
            arcade.Text(
                text,
                leaderboard_x + 20,
                leaderboard_y - row_height * (i+1),
                color,
                18
            ).draw()

        # Controls Legend (bottom left)
        legend_x = 30
        legend_y = 180
        legend_lines = [
            "Controls:",
            "[SPACE]  Pause/Resume",
            "[←/→]    Rewind / Fast Forward",
            "[↑/↓]    Increase / Decrease Speed",
            "[1-4]    Set Speed (0.5x, 1x, 2x, 4x)",
        ]
        for i, line in enumerate(legend_lines):
            arcade.Text(
                line,
                legend_x,
                legend_y - i * 28,
                arcade.color.LIGHT_GRAY if i > 0 else arcade.color.WHITE,
                20 if i > 0 else 22,
                anchor_x="left",
                anchor_y="top",
                bold=(i == 0)
            ).draw()

    def on_update(self, delta_time: float):

        if self.paused:
            return

        # Advance frame based on playback_speed
        step = max(1, int(self.playback_speed))  # integer step for simplicity
        self.frame_index += step

        if self.frame_index >= self.n_frames:
            self.frame_index = self.n_frames - 1  # stop at end

    def on_key_press(self, symbol: int, modifiers: int):
        # Space: pause/unpause
        if symbol == arcade.key.SPACE:
            self.paused = not self.paused

        # Left/right arrow: scrub
        elif symbol == arcade.key.RIGHT:
            self.frame_index = min(self.frame_index + 5, self.n_frames - 1)
        elif symbol == arcade.key.LEFT:
            self.frame_index = max(self.frame_index - 5, 0)
        elif symbol == arcade.key.UP:
            # Increase playback speed
            self.playback_speed *= 2.0
        elif symbol == arcade.key.DOWN:
            # Decrease playback speed
            self.playback_speed = max(0.1, self.playback_speed / 2.0)

        # Number keys to change playback speed
        elif symbol == arcade.key.KEY_1:
            self.playback_speed = 0.5
        elif symbol == arcade.key.KEY_2:
            self.playback_speed = 1.0
        elif symbol == arcade.key.KEY_3:
            self.playback_speed = 2.0
        elif symbol == arcade.key.KEY_4:
            self.playback_speed = 4.0


def run_arcade_replay(frames, example_lap, drivers, title,
                      playback_speed=1.0, driver_colors=None):
    window = F1ReplayWindow(
        frames=frames,
        example_lap=example_lap,
        drivers=drivers,
        playback_speed=playback_speed,
        driver_colors=driver_colors,
        title=title
    )
    arcade.run()
