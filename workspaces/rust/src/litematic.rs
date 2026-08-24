use mcdata::{util::BlockPos, GenericBlockState};
use rustmatica::Region;

use crate::palette::{self, BlockDef};

/// 把方块 ID 构造为 GenericBlockState（无额外方块状态属性）。
fn block_state(block_id: &'static str) -> GenericBlockState {
    GenericBlockState {
        name: block_id.into(),
        properties: Default::default(),
    }
}

/// 构建一个 Litematica 投影（gzip 压缩的 NBT），返回文件字节。
/// 投影平铺在地面（Size = width × 1 × height）。
///
/// colors 为每个像素的 normal 颜色，palette 用于把颜色反查为 Minecraft 方块 ID。
/// 重复颜色取调色板中靠前者。
pub fn build_projection(
    name: &str,
    colors: &[[u8; 3]],
    palette: &[BlockDef],
    width: usize,
    height: usize,
) -> Vec<u8> {
    let mut region: Region = Region::new(
        name.to_owned(),
        BlockPos::new(0, 0, 0),
        BlockPos::new(width as i32, 1, height as i32),
    );

    // 平铺在地面（Size = width × 1 × height）。
    // 按 Minecraft 地图「上北下南、左西右东」约定：图片行 0（顶部）→ z=0（北），
    // 图片左列 → x=0（西）。即 block(x, 0, z) = pixel(x, z)，不做镜像/翻转。
    for z in 0..height {
        for x in 0..width {
            let id = palette::block_id_of(&colors[z * width + x], palette);
            region.set_block(BlockPos::new(x as i32, 0, z as i32), block_state(id));
        }
    }

    let schem = region.as_litematic("", "penelope.saviya.me");
    schem.to_bytes().expect("litematic: 序列化失败")
}

/// 把多个文件打包成一个 ZIP（内容本身已是 gzip，故 ZIP 使用 store 不压缩），返回 ZIP 字节。
pub fn build_zip(files: &[(String, Vec<u8>)]) -> Vec<u8> {
    let mut out = Vec::new();
    let mut central = Vec::new();
    let mut offset = 0u32;

    for (name, data) in files {
        let name_bytes = name.as_bytes();
        let crc = crc32(data);

        // Local file header
        out.extend_from_slice(&0x0403_4b50u32.to_le_bytes());
        out.extend_from_slice(&20u16.to_le_bytes());
        out.extend_from_slice(&0u16.to_le_bytes()); // flags
        out.extend_from_slice(&0u16.to_le_bytes()); // method = store
        out.extend_from_slice(&0u16.to_le_bytes()); // mod time
        out.extend_from_slice(&0x21u16.to_le_bytes()); // mod date (1980-01-01)
        out.extend_from_slice(&crc.to_le_bytes());
        out.extend_from_slice(&(data.len() as u32).to_le_bytes());
        out.extend_from_slice(&(data.len() as u32).to_le_bytes());
        out.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes());
        out.extend_from_slice(&0u16.to_le_bytes()); // extra len
        out.extend_from_slice(name_bytes);
        out.extend_from_slice(data);

        // Central directory entry
        central.extend_from_slice(&0x0201_4b50u32.to_le_bytes());
        central.extend_from_slice(&20u16.to_le_bytes());
        central.extend_from_slice(&20u16.to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes());
        central.extend_from_slice(&0x21u16.to_le_bytes());
        central.extend_from_slice(&crc.to_le_bytes());
        central.extend_from_slice(&(data.len() as u32).to_le_bytes());
        central.extend_from_slice(&(data.len() as u32).to_le_bytes());
        central.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes()); // extra len
        central.extend_from_slice(&0u16.to_le_bytes()); // comment len
        central.extend_from_slice(&0u16.to_le_bytes()); // disk number
        central.extend_from_slice(&0u16.to_le_bytes()); // internal attrs
        central.extend_from_slice(&0u32.to_le_bytes()); // external attrs
        central.extend_from_slice(&offset.to_le_bytes());
        central.extend_from_slice(name_bytes);

        offset += (30 + name_bytes.len() + data.len()) as u32;
    }

    let central_offset = out.len() as u32;
    out.extend_from_slice(&central);

    // End of central directory
    out.extend_from_slice(&0x0605_4b50u32.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&(files.len() as u16).to_le_bytes());
    out.extend_from_slice(&(files.len() as u16).to_le_bytes());
    out.extend_from_slice(&(central.len() as u32).to_le_bytes());
    out.extend_from_slice(&central_offset.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());

    out
}

fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &b in data {
        crc ^= b as u32;
        for _ in 0..8 {
            crc = if crc & 1 != 0 {
                (crc >> 1) ^ 0xEDB8_8320
            } else {
                crc >> 1
            };
        }
    }
    !crc
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::palette::CARPETS;
    use mcdata::util::BlockPos;
    use rustmatica::Litematic;

    #[test]
    fn round_trips_through_rustmatica() {
        // 2×2：白、橙 / 黑、品红
        let colors = vec![
            [171, 171, 171], // white
            [186, 109, 44],  // orange
            [21, 21, 21],    // black
            [153, 65, 186],  // magenta
        ];
        let bytes = build_projection("Test", &colors, CARPETS, 2, 2);

        // gzip magic
        assert_eq!(&bytes[0..2], &[0x1f, 0x8b]);

        let schem: Litematic = Litematic::from_bytes(&bytes).unwrap();
        assert_eq!(schem.regions.len(), 1);
        let region = &schem.regions[0];
        assert_eq!(region.size, BlockPos::new(2, 1, 2));

        // 图片行 0（顶部）→ z=0（北），图片左列 → x=0（西），不做镜像/翻转
        assert_eq!(
            region.get_block(BlockPos::new(0, 0, 0)),
            &block_state("minecraft:white_carpet") // white（左上）
        );
        assert_eq!(
            region.get_block(BlockPos::new(1, 0, 0)),
            &block_state("minecraft:orange_carpet") // orange（右上）
        );
        assert_eq!(
            region.get_block(BlockPos::new(0, 0, 1)),
            &block_state("minecraft:black_carpet") // black（左下）
        );
        assert_eq!(
            region.get_block(BlockPos::new(1, 0, 1)),
            &block_state("minecraft:magenta_carpet") // magenta（右下）
        );
    }
}
