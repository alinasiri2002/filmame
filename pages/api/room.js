import {clientPromise} from "../../db/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  switch (req.method) {

    case "POST":
        var body = req.body
        let newRoom = await db.collection("room").insertOne(body);
        res.json(newRoom);
        break;


    case "PUT":
        var body = req.body
        const Updatedroom = await db.collection("room").update(
            { _id : body.id },
            {$set: {
                playing: body.playing,
                time: body.time,
                movieUrl: body.movieUrl,
                subUrl: body.subUrl,
            }}

        );
        res.json({ status: 200, data: Updatedroom });
        break;
  }
}