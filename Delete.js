module.exports = async function Deletefile(deleting_Item_ID, fs, Product) {
  try {
    const item = await Product.findOne({ _id: deleting_Item_ID });
    if (item) {
      const filePath1 = "public/images/" + item.image.img1;
      const filePath2 = "public/images/" + item.image.img2;
      const filePath3 = "public/images/" + item.image.img3;

      if (fs.existsSync(filePath1) && fs.existsSync(filePath2) && fs.existsSync(filePath3)) {
        await Product.deleteOne({ _id: deleting_Item_ID });
        fs.unlinkSync(filePath1);
        fs.unlinkSync(filePath2);
        fs.unlinkSync(filePath3);
        console.log('File deleted successfully');
      } else {
        console.log('File not found');
      }
    } else {
      console.log('Item not found');
    }
  } catch (error) {
    console.error(error);
  }};