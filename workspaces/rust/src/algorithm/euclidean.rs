use super::ColorDistance;

/// 欧式距离。
pub struct Euclidean;

impl ColorDistance for Euclidean {
    fn distance(&self, a: &[f32; 3], b: &[u8; 3]) -> f32 {
        let dr = a[0] - b[0] as f32;
        let dg = a[1] - b[1] as f32;
        let db = a[2] - b[2] as f32;

        (dr * dr + dg * dg + db * db).sqrt()
    }
}
