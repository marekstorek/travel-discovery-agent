from datetime import datetime

from pydantic import BaseModel, Field
from typing import Literal, Annotated, Union
from uuid import UUID

class BaseSpot(BaseModel):
    id: UUID | None = None
    created_at: datetime | None = None
    name: str = Field(description="The name of the spot",)
    commentary: str | None = Field(default=None, description="Anything important mentioned in the input or anything that needs to be addressed.")
    source_link: str | None = Field(default=None, description="The link to the source page, post or video, if it is known.")
    country: str | None = Field(default=None, description="The country of the spot.")
    region: str | None = Field(default=None, description="The region of the spot.")
    latitude: float | None = Field(default=None, description="The latitude of the spot.")
    longitude: float | None = Field(default=None, description="The longitude of the spot.")

class Hike(BaseSpot):
    category: Literal["Hike"] = "Hike"
    total_elevation_meters: int | None = Field(default=None, description="The total elevation in meters hiker needs to climb for this hike.")
    min_altitude_meters: int | None = Field(default=None, description="The minimum altitude of the hike. (above sea level)")
    max_altitude_meters: int | None = Field(default=None, description="The maximum altitude of the hike. It is important to known if the hike is peaks at 1000m above sea level or 4000m.")
    length_km: float | None = Field(default=None, description="The length of the hike.")
    duration_minutes: int | None = Field(default=None, description="The duration of the hike. Moving time.")
    duration_days: int | None = Field(default=None, description="The recommended number of days for the hike. Longer and harder hikes may include sleeping in a mountain hut.")
    difficulty: Literal["Easy", "Moderate", "Hard", "Extreme"] | None = None
    needs_via_ferrata_set: bool | None = Field(default=None, description="Whether the spot needs via ferrata set.")
    needs_climbing_gear: bool | None = Field(default=None, description="Whether the spot needs climbing gear.")
    chairlift_available: bool | None = Field(default=None, description="Whether a chairlift or cable car is available on this hike.")
    checkpoints: list[str] = Field(default_factory=list, description="Significant waypoints along the route. Mountain hut, crossroad, summit. The name of it.")

class Summit(BaseSpot):
    category: Literal["Summit"] = "Summit"
    altitude_meters: int | None = Field(default=None, description="The altitude in meters. (above sea level)")
    min_elevation_to_access_meters: int | None = Field(default=None, description="The minimum elevation in meters needed to hike to access this spot.")
    difficulty: Literal["Easy", "Moderate", "Hard", "Extreme"] | None = None
    needs_via_ferrata_set: bool | None = Field(default=None, description="Whether the spot needs via ferrata set.")
    needs_climbing_gear: bool | None = Field(default=None, description="Whether the spot needs climbing gear.")
    chairlift_available: bool | None = Field(default=None, description="Whether a chairlift or cable car is available to access this summit.")

class Viewpoint(BaseSpot):
    category: Literal["Viewpoint"] = "Viewpoint"
    altitude_meters: int | None = Field(default=None, description="The altitude in meters. (above sea level)")
    difficulty: Literal["Easy", "Moderate", "Hard", "Extreme"] | None = None

class City(BaseSpot):
    category: Literal["City"] = "City"

class Beach(BaseSpot):
    category: Literal["Beach"] = "Beach"
    surface: Literal["Sand", "Pebble", "Rocky", "Concrete", "Grass", "Other"] | None = Field(default=None, description="The surface of the beach.")
    length_meters: int | None = Field(default=None, description="The length of the beach in meters.")

class Food(BaseSpot):
    category: Literal["Food"] = "Food"
    food_type: Literal["Restaurant", "Bar", "Cafe", "Street Food", "Mountain Hut", "Bakery", "Other"] | None = None
    speciality: list[str] = Field(default_factory=list, description="A list of specialities mentioned in the source. Or anything really, really typical to this spot.")

class Culture(BaseSpot):
    category: Literal["Culture"] = "Culture"
    culture_type: Literal["Castle", "Museum", "Theatre", "Monument", "Ruins", "Other"] | None = None

class Camp(BaseSpot):
    category: Literal["Camp"] = "Camp"
    is_for_cars: bool | None = Field(default=None, description="Whether the camp is convenient for cars or caravans.")
    has_shower: bool | None = Field(default=None, description="Whether the camp has a shower.")
    swimming_available: bool | None = Field(default=None, description="Whether the camp has a swimming pond or whatever.")

class OtherSpot(BaseSpot):
    category: Literal["Other"] = "Other"

Spot = Annotated[
    Union[Hike, Summit, Viewpoint, City, Beach, Food, Culture, Camp, OtherSpot],
    Field(discriminator="category")
]

class AiResponse(BaseModel):
    spots: list[Spot] = Field(default_factory=list, description="A list of spots extracted from the input.")
