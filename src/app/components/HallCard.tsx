import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip
} from "@mui/material";
import {
  People,
  MusicNote,
  CalendarMonth,
  ArrowBack
} from "@mui/icons-material";

const hallsData = {
  "1": {
    name: "Зал A",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
    capacity: "до 5 человек",
    price: "1500 ₽/час",
    area: "25 м²",
    description: "Идеальный зал для рок и металл групп."
  },
  "2": {
    name: "Зал B",
    image: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800",
    capacity: "до 8 человек",
    price: "2000 ₽/час",
    area: "40 м²",
    description: "Премиум зал с роялем и студией звукозаписи."
  }
};

export function HallCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hall = hallsData[id as keyof typeof hallsData] || hallsData["1"];

  return (
    <Box className="max-w-3xl mx-auto">
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/booking")}
        sx={{ mb: 3 }}
      >
        Назад к списку
      </Button>

      <Card>
        <CardMedia
          component="img"
          height="300"
          image={hall.image}
          alt={hall.name}
        />

        <CardContent sx={{ p: 4 }}>
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h4" component="h1">
              {hall.name}
            </Typography>
            <Typography variant="h5" sx={{ color: '#616161' }}>
              {hall.price}
            </Typography>
          </Box>

          <Box className="flex gap-2 mb-4">
            <Chip icon={<People />} label={hall.capacity} />
            <Chip icon={<MusicNote />} label={hall.area} />
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            {hall.description}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<CalendarMonth />}
            onClick={() => navigate("/booking")}
            sx={{ mt: 4, bgcolor: '#757575', '&:hover': { bgcolor: '#616161' } }}
          >
            Забронировать зал
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
