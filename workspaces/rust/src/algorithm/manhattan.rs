use super::ColorDistance;

/// 曼哈顿距离。
pub struct Manhattan;

impl ColorDistance for Manhattan {
    fn distance(&self, a: &[f32; 3], b: &[u8; 3]) -> f32 {
        (a[0] - b[0] as f32).abs() + (a[1] - b[1] as f32).abs() + (a[2] - b[2] as f32).abs()
    }
}
