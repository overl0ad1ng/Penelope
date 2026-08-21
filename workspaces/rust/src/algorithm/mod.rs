/// 颜色距离算法的统一 trait：每种距离算法一个独立实现。
pub trait ColorDistance {
    /// 计算两个颜色之间的距离，值越小越接近。
    fn distance(&self, a: &[f32; 3], b: &[u8; 3]) -> f32;
}

mod euclidean;
mod hsl_weighted;
mod manhattan;
mod redmean;
mod weighted_euclidean;

pub use euclidean::Euclidean;
pub use hsl_weighted::{HslAtkinson, HslBayer};
pub use manhattan::Manhattan;
pub use redmean::Redmean;
pub use weighted_euclidean::WeightedEuclidean;

/// 根据名称解析颜色距离算法，未知名称回退到 HslBayer。
pub fn resolve(name: &str) -> Box<dyn ColorDistance> {
    match name {
        "euclidean" => Box::new(Euclidean),
        "manhattan" => Box::new(Manhattan),
        "weighted-euclidean" => Box::new(WeightedEuclidean),
        "redmean" => Box::new(Redmean),
        "hsl-atkinson" => Box::new(HslAtkinson),
        // 兼容旧版持久化偏好：hsl-weighted 曾经先后指向 v2/v3，统一归到继任者 HslBayer
        "hsl-weighted" | "hsl-bayer" => Box::new(HslBayer),
        _ => Box::new(HslBayer), // 默认为 HSL 加权（Bayer 版）
    }
}
