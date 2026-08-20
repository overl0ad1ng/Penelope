use super::ColorDistance;

/// 加权欧式距离（Rec. 601 亮度权重：红 0.299、绿 0.587、蓝 0.114）。
pub struct WeightedEuclidean;

impl ColorDistance for WeightedEuclidean {
    fn distance(&self, a: &[f32; 3], b: &[u8; 3]) -> f32 {
        let dr = a[0] - b[0] as f32;
        let dg = a[1] - b[1] as f32;
        let db = a[2] - b[2] as f32;

        (0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db).sqrt()
    }
}
