/// 对像素缓冲（每像素 3 通道 f32）做「对比度增强 + 亮度降低」。
/// enhance ∈ [0, 1]：0 = 原图，1 = 最大增强。
pub fn apply(buf: &mut [f32], enhance: f32) {
    if enhance <= 0.0 {
        return;
    }

    // 对比度：以 128 为中心拉伸（最多 1.5 倍）
    let contrast = 1.0 + enhance * 0.5;
    // 亮度：整体压低（最多 0.8 倍）
    let brightness = 1.0 - enhance * 0.2;

    for i in (0..buf.len()).step_by(3) {
        for ch in 0..3 {
            let v = (buf[i + ch] - 128.0) * contrast + 128.0;
            let v = v * brightness;
            buf[i + ch] = v.max(0.0).min(255.0);
        }
    }
}
