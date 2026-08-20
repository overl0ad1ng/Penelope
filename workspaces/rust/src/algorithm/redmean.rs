use super::ColorDistance;

/// Redmean 颜色距离。
pub struct Redmean;

impl ColorDistance for Redmean {
    fn distance(&self, a: &[f32; 3], b: &[u8; 3]) -> f32 {
        let r_mean = (a[0] + b[0] as f32) / 2.0;
        let dr = a[0] - b[0] as f32;
        let dg = a[1] - b[1] as f32;
        let db = a[2] - b[2] as f32;

        let rw = 2.0 + r_mean / 256.0;
        let gw = 4.0;
        let bw = 2.0 + (255.0 - r_mean) / 256.0;

        (rw * dr * dr + gw * dg * dg + bw * db * db).sqrt()
    }
}
